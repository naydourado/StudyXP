# dados da conta do usuario logado e direitos do titular (lgpd art. 18)
from fastapi import APIRouter, Depends, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core import tempo
from app.core.config import get_settings
from app.core.cripto import decifrar
from app.core.database import get_db
from app.core.deps import get_usuario_atual
from app.core.erros import ErroAPI
from app.core.seguranca import gerar_hash_senha, revogar_todos_do_usuario, verificar_senha
from app.models import (
    Consentimento,
    DispositivoPush,
    EventoXP,
    HistoricoAcesso,
    Preferencias,
    RefreshToken,
    RegistroHumor,
    SessaoFoco,
    Tarefa,
    Usuario,
    UsuarioConquista,
)
from app.models.enums import TipoConsentimento
from app.routers.auth import COOKIE_REFRESH
from app.schemas.comum import Mensagem
from app.schemas.conta import (
    ConfirmacaoSenha,
    ConsentimentoHumorIn,
    ConsentimentosOut,
    DispositivoIn,
    DispositivoRemover,
    PerfilUpdate,
    PreferenciasIO,
    TrocaSenha,
    UsuarioOut,
)
from app.services.consentimentos import consentiu_humor

router = APIRouter(prefix="/me", tags=["conta"])


@router.get("", response_model=UsuarioOut)
def ler_perfil(usuario: Usuario = Depends(get_usuario_atual)):
    return usuario


@router.patch("", response_model=UsuarioOut)
def editar_perfil(dados: PerfilUpdate, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    if dados.email is not None:
        email = dados.email.lower()
        em_uso = db.scalar(select(Usuario.id).where(Usuario.email == email, Usuario.id != usuario.id))
        if em_uso:
            raise ErroAPI(409, "Este e-mail já está cadastrado.", "email_em_uso")
        usuario.email = email

    if dados.nome is not None:
        usuario.nome = dados.nome
    if dados.bio is not None:
        usuario.bio = dados.bio or None
    if dados.fuso_horario is not None:
        usuario.fuso_horario = dados.fuso_horario

    db.commit()
    return usuario


@router.put("/senha", response_model=Mensagem)
def trocar_senha(dados: TrocaSenha, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    if not verificar_senha(dados.senha_atual, usuario.senha_hash):
        raise ErroAPI(400, "Senha atual incorreta.", "senha_incorreta")

    usuario.senha_hash = gerar_hash_senha(dados.nova_senha)
    # desconecta as outras sessoes; o access token atual expira em poucos minutos
    revogar_todos_do_usuario(db, usuario.id)
    db.commit()
    return {"mensagem": "Senha alterada. Faça login novamente nos outros dispositivos."}


@router.delete("", status_code=204)
def excluir_conta(
    dados: ConfirmacaoSenha,
    response: Response,
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    if not verificar_senha(dados.senha, usuario.senha_hash):
        raise ErroAPI(400, "Senha incorreta.", "senha_incorreta")

    # o cascade apaga tarefas, humor, foco, xp, conquistas, sessoes e consentimentos
    db.delete(usuario)
    db.commit()
    response.delete_cookie(COOKIE_REFRESH, path="/api/v1/auth")
    response.status_code = 204
    return response


# portabilidade: todos os dados do usuario em json
@router.get("/exportar")
def exportar_dados(usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    def linhas(model):
        return db.scalars(select(model).where(model.usuario_id == usuario.id)).all()

    preferencias = db.get(Preferencias, usuario.id)
    return {
        "gerado_em": tempo.agora(),
        "usuario": {
            "id": usuario.id,
            "nome": usuario.nome,
            "email": usuario.email,
            "bio": usuario.bio,
            "fuso_horario": usuario.fuso_horario,
            "xp": usuario.xp,
            "ofensiva_atual": usuario.ofensiva_atual,
            "ofensiva_recorde": usuario.ofensiva_recorde,
            "criado_em": usuario.criado_em,
        },
        "preferencias": PreferenciasIO.model_validate(preferencias).model_dump() if preferencias else None,
        "tarefas": [
            {
                "titulo": t.titulo,
                "descricao": t.descricao,
                "prioridade": t.prioridade,
                "status": t.status,
                "data_prazo": t.data_prazo,
                "data_conclusao": t.data_conclusao,
                "criado_em": t.criado_em,
            }
            for t in linhas(Tarefa)
        ],
        "sessoes_foco": [
            {
                "tipo": s.tipo,
                "duracao_planejada": s.duracao_planejada,
                "status": s.status,
                "iniciada_em": s.iniciada_em,
                "minutos_validos": s.minutos_validos,
            }
            for s in linhas(SessaoFoco)
        ],
        "registros_humor": [
            {"humor": h.humor, "observacao": decifrar(h.observacao_cifrada), "criado_em": h.criado_em}
            for h in linhas(RegistroHumor)
        ],
        "eventos_xp": [{"origem": e.origem, "xp": e.xp, "criado_em": e.criado_em} for e in linhas(EventoXP)],
        "conquistas": [{"codigo": c.codigo, "desbloqueada_em": c.desbloqueada_em} for c in linhas(UsuarioConquista)],
        "consentimentos": [
            {"tipo": c.tipo, "versao": c.versao, "concedido": c.concedido, "criado_em": c.criado_em}
            for c in linhas(Consentimento)
        ],
        # tudo o que guardamos sobre o titular entra na exportacao (lgpd art. 18, ii)
        "acessos": [{"ip": a.ip, "data": a.criado_em} for a in linhas(HistoricoAcesso)],
        "sessoes": [
            {"tipo": r.dispositivo, "criada_em": r.criado_em, "expira_em": r.expira_em, "encerrada_em": r.revogado_em}
            for r in linhas(RefreshToken)
        ],
        "dispositivos_notificacao": [
            {"plataforma": d.plataforma, "registrado_em": d.criado_em} for d in linhas(DispositivoPush)
        ],
        "termos": {"versao_aceita": usuario.termos_versao, "aceitos_em": usuario.termos_aceitos_em},
    }


def _preferencias(db: Session, usuario: Usuario) -> Preferencias:
    preferencias = db.get(Preferencias, usuario.id)
    if preferencias is None:
        preferencias = Preferencias(usuario_id=usuario.id)
        db.add(preferencias)
        db.flush()
    return preferencias


@router.get("/preferencias", response_model=PreferenciasIO)
def ler_preferencias(usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    preferencias = _preferencias(db, usuario)
    db.commit()
    return preferencias


@router.put("/preferencias", response_model=PreferenciasIO)
def salvar_preferencias(
    dados: PreferenciasIO, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)
):
    preferencias = _preferencias(db, usuario)
    preferencias.lembrete_tarefas = dados.lembrete_tarefas
    preferencias.som_pomodoro = dados.som_pomodoro
    preferencias.resumo_semanal = dados.resumo_semanal
    db.commit()
    return preferencias


@router.get("/consentimentos", response_model=ConsentimentosOut)
def ler_consentimentos(usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    return {
        "termos_versao": usuario.termos_versao,
        "termos_aceitos_em": usuario.termos_aceitos_em,
        "humor": consentiu_humor(db, usuario.id),
    }


# revogar o consentimento do humor apaga todos os registros de humor (lgpd art. 18, ix)
@router.put("/consentimentos", response_model=ConsentimentosOut)
def salvar_consentimento_humor(
    dados: ConsentimentoHumorIn, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)
):
    if dados.humor != consentiu_humor(db, usuario.id):
        db.add(
            Consentimento(
                usuario_id=usuario.id,
                tipo=TipoConsentimento.HUMOR,
                versao=get_settings().termos_versao,
                concedido=dados.humor,
            )
        )
        if not dados.humor:
            db.execute(delete(RegistroHumor).where(RegistroHumor.usuario_id == usuario.id))
        db.commit()

    return ler_consentimentos(usuario, db)


# token de push do celular: se ja era de outra conta (troca de usuario no aparelho), passa para esta
@router.post("/dispositivos", status_code=204)
def registrar_dispositivo(
    dados: DispositivoIn, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)
):
    dispositivo = db.scalar(select(DispositivoPush).where(DispositivoPush.token == dados.token))
    if dispositivo is None:
        db.add(DispositivoPush(usuario_id=usuario.id, token=dados.token, plataforma=dados.plataforma))
    else:
        dispositivo.usuario_id = usuario.id
        dispositivo.plataforma = dados.plataforma
    db.commit()
    return Response(status_code=204)


@router.delete("/dispositivos", status_code=204)
def remover_dispositivo(
    dados: DispositivoRemover, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)
):
    db.execute(
        delete(DispositivoPush).where(DispositivoPush.token == dados.token, DispositivoPush.usuario_id == usuario.id)
    )
    db.commit()
    return Response(status_code=204)


# nova versao dos termos/politica: o usuario confirma o aceite no proximo acesso
@router.post("/aceitar-termos", response_model=UsuarioOut)
def aceitar_termos(usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    versao = get_settings().termos_versao
    if usuario.termos_versao != versao:
        usuario.termos_versao = versao
        usuario.termos_aceitos_em = tempo.agora()
        db.add(Consentimento(usuario_id=usuario.id, tipo=TipoConsentimento.TERMOS, versao=versao, concedido=True))
        db.commit()
    return usuario
