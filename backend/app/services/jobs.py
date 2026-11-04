# tarefas periodicas, disparadas de hora em hora pelo agendador (github actions -> rota /interno/jobs)
# cada job e idempotente: rodar duas vezes seguidas nao repete lembrete nem e-mail
from datetime import timedelta

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.core import tempo
from app.models import (
    DispositivoPush,
    HistoricoAcesso,
    Preferencias,
    RefreshToken,
    SessaoFoco,
    Tarefa,
    TokenRedefinicaoSenha,
    Usuario,
)
from app.models.enums import StatusSessao, StatusTarefa
from app.services.email import email_resumo_semanal, enviar_email
from app.services.estatisticas import serie_por_dia
from app.services.gamificacao import nivel_por_xp
from app.services.ofensiva import ofensiva_vigente
from app.services.push import Notificacao, enviar_push

# horarios locais a partir dos quais os avisos sao enviados
HORA_LEMBRETE_VESPERA = 18
HORA_LEMBRETE_DIA = 8
HORA_RESUMO_DOMINGO = 18

RETENCAO_ACESSOS = timedelta(days=180)


def _texto_tarefas(titulos: list[str]) -> str:
    if len(titulos) == 1:
        return titulos[0]
    return f"{titulos[0]} e mais {len(titulos) - 1}"


def enviar_lembretes(db: Session) -> dict:
    """Push na vespera (a partir das 18h) e no dia do prazo (a partir das 8h), no fuso de cada usuario."""
    agora = tempo.agora()

    usuarios = db.scalars(
        select(Usuario)
        .join(Preferencias, Preferencias.usuario_id == Usuario.id)
        .where(Preferencias.lembrete_tarefas.is_(True))
        .where(select(DispositivoPush.id).where(DispositivoPush.usuario_id == Usuario.id).exists())
    ).all()

    notificacoes: list[Notificacao] = []
    tarefas_avisadas = 0

    for usuario in usuarios:
        local = tempo.para_local(agora, usuario.fuso_horario)
        hoje = local.date()
        grupos = []

        if local.hour >= HORA_LEMBRETE_VESPERA:
            grupos.append(("vespera", hoje + timedelta(days=1), Tarefa.lembrete_vespera_em, "Tarefas para amanhã"))
        if local.hour >= HORA_LEMBRETE_DIA:
            grupos.append(("dia", hoje, Tarefa.lembrete_dia_em, "Tarefas para hoje"))

        for tipo, prazo, coluna, titulo in grupos:
            tarefas = db.scalars(
                select(Tarefa)
                .where(
                    Tarefa.usuario_id == usuario.id,
                    Tarefa.status == StatusTarefa.PENDENTE,
                    Tarefa.data_prazo == prazo,
                    coluna.is_(None),
                )
                .order_by(Tarefa.criado_em)
            ).all()
            if not tarefas:
                continue

            for tarefa in tarefas:
                setattr(tarefa, coluna.key, agora)
            tarefas_avisadas += len(tarefas)

            corpo = _texto_tarefas([t.titulo for t in tarefas])
            for token in db.scalars(select(DispositivoPush.token).where(DispositivoPush.usuario_id == usuario.id)):
                notificacoes.append(Notificacao(token, titulo, corpo, {"tela": "tarefas", "tipo": tipo}))

    db.commit()
    enviadas = enviar_push(db, notificacoes)
    db.commit()
    return {"tarefas_avisadas": tarefas_avisadas, "notificacoes": enviadas}


def enviar_resumos_semanais(db: Session) -> dict:
    """E-mail no domingo a partir das 18h (horario local) para quem ligou o resumo semanal."""
    agora = tempo.agora()
    enviados = 0

    linhas = db.execute(
        select(Usuario, Preferencias)
        .join(Preferencias, Preferencias.usuario_id == Usuario.id)
        .where(Preferencias.resumo_semanal.is_(True))
    ).all()

    for usuario, preferencias in linhas:
        local = tempo.para_local(agora, usuario.fuso_horario)
        hoje = local.date()
        # weekday(): segunda = 0 ... domingo = 6
        if hoje.weekday() != 6 or local.hour < HORA_RESUMO_DOMINGO or preferencias.resumo_enviado_em == hoje:
            continue

        serie = serie_por_dia(db, usuario, hoje - timedelta(days=6), hoje)
        resumo = {
            "xp": sum(d["xp"] for d in serie.values()),
            "tarefas": sum(d["tarefas_concluidas"] for d in serie.values()),
            "minutos_foco": sum(d["minutos_foco"] for d in serie.values()),
            "ofensiva": ofensiva_vigente(usuario),
            "nivel": nivel_por_xp(usuario.xp),
        }
        if enviar_email(email_resumo_semanal(usuario.email, usuario.nome, resumo)):
            preferencias.resumo_enviado_em = hoje
            enviados += 1

    db.commit()
    return {"resumos_enviados": enviados}


def limpar_dados_antigos(db: Session) -> dict:
    """Retencao (lgpd): apaga logs de acesso com mais de 6 meses e tokens vencidos."""
    agora = tempo.agora()

    acessos = db.execute(delete(HistoricoAcesso).where(HistoricoAcesso.criado_em < agora - RETENCAO_ACESSOS))
    refresh = db.execute(
        delete(RefreshToken).where(
            (RefreshToken.expira_em < agora - timedelta(days=1))
            | (RefreshToken.revogado_em < agora - timedelta(days=30))
        )
    )
    redefinicao = db.execute(
        delete(TokenRedefinicaoSenha).where(TokenRedefinicaoSenha.expira_em < agora - timedelta(days=1))
    )
    # sessoes de foco esquecidas abertas ha mais de um dia
    sessoes = db.execute(
        update(SessaoFoco)
        .where(SessaoFoco.status == StatusSessao.EM_ANDAMENTO, SessaoFoco.iniciada_em < agora - timedelta(days=1))
        .values(status=StatusSessao.CANCELADA, finalizada_em=agora)
    )
    db.commit()

    return {
        "acessos_apagados": acessos.rowcount,
        "refresh_tokens_apagados": refresh.rowcount,
        "tokens_redefinicao_apagados": redefinicao.rowcount,
        "sessoes_canceladas": sessoes.rowcount,
    }


JOBS = {
    "lembretes": enviar_lembretes,
    "resumo-semanal": enviar_resumos_semanais,
    "limpeza": limpar_dados_antigos,
}
