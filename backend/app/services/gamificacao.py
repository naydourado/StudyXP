# regras de xp e nivel - unico lugar do sistema que decide quanto xp o usuario ganha
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import tempo
from app.models import EventoXP, Usuario
from app.models.enums import OrigemXP, Prioridade

# valores definidos pelo time (iguais aos do prototipo)
XP_POR_PRIORIDADE = {
    Prioridade.BAIXA: 20,
    Prioridade.MEDIA: 50,
    Prioridade.ALTA: 80,
}

# limites diarios contra "farm" de xp
LIMITE_TAREFAS_PONTUANDO_POR_DIA = 15
LIMITE_XP_FOCO_POR_DIA = 240
XP_POR_MINUTO_FOCO = 1
XP_PRIMEIRO_HUMOR_DO_DIA = 5


# xp acumulado necessario para chegar ao nivel n
# do nivel n para o n+1 sao necessarios 100 * n xp -> total = 50 * n * (n - 1)
def xp_total_para_nivel(nivel: int) -> int:
    return 50 * nivel * (nivel - 1)


def nivel_por_xp(xp: int) -> int:
    nivel = 1
    while xp >= xp_total_para_nivel(nivel + 1):
        nivel += 1
    return nivel


def faixa_do_nivel(xp: int) -> dict:
    nivel = nivel_por_xp(xp)
    inicio = xp_total_para_nivel(nivel)
    tamanho = xp_total_para_nivel(nivel + 1) - inicio
    xp_no_nivel = xp - inicio
    return {
        "xp_total": xp,
        "nivel": nivel,
        "xp_no_nivel": xp_no_nivel,
        "xp_para_proximo": tamanho,
        "percentual": round(xp_no_nivel / tamanho * 100, 1),
    }


def registrar_xp(db: Session, usuario: Usuario, origem: OrigemXP, origem_id: int | None, xp: int) -> None:
    if xp == 0:
        return
    db.add(EventoXP(usuario_id=usuario.id, origem=origem, origem_id=origem_id, xp=xp))
    usuario.xp = max(0, usuario.xp + xp)


# soma (ou conta) os eventos positivos de uma origem no dia local do usuario
def _eventos_do_dia(db: Session, usuario: Usuario, origem: OrigemXP, agregado):
    inicio, fim = tempo.limites_do_dia(tempo.dia_local(tempo.agora(), usuario.fuso_horario), usuario.fuso_horario)
    return (
        db.scalar(
            select(agregado).where(
                EventoXP.usuario_id == usuario.id,
                EventoXP.origem == origem,
                EventoXP.xp > 0,
                EventoXP.criado_em >= inicio,
                EventoXP.criado_em < fim,
            )
        )
        or 0
    )


def xp_para_conclusao_de_tarefa(db: Session, usuario: Usuario, xp_recompensa: int) -> int:
    pontuadas_hoje = _eventos_do_dia(db, usuario, OrigemXP.TAREFA, func.count(EventoXP.id))
    if pontuadas_hoje >= LIMITE_TAREFAS_PONTUANDO_POR_DIA:
        return 0
    return xp_recompensa


def xp_para_minutos_de_foco(db: Session, usuario: Usuario, minutos: int) -> int:
    ganho_hoje = _eventos_do_dia(db, usuario, OrigemXP.FOCO, func.sum(EventoXP.xp))
    restante = max(0, LIMITE_XP_FOCO_POR_DIA - ganho_hoje)
    return min(minutos * XP_POR_MINUTO_FOCO, restante)


def xp_para_registro_de_humor(db: Session, usuario: Usuario) -> int:
    ja_ganhou_hoje = _eventos_do_dia(db, usuario, OrigemXP.HUMOR, func.count(EventoXP.id))
    return 0 if ja_ganhou_hoje else XP_PRIMEIRO_HUMOR_DO_DIA
