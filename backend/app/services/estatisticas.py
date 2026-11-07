# estatisticas por dia (no fuso do usuario), usadas no progresso, no dashboard e no resumo semanal
from collections import defaultdict
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import tempo
from app.models import EventoXP, SessaoFoco, Tarefa, Usuario
from app.models.enums import StatusTarefa, TipoSessao


# agrupa por dia local do usuario (feito em python para funcionar igual em postgres e sqlite)
def serie_por_dia(db: Session, usuario: Usuario, inicio: date, fim: date) -> dict[date, dict]:
    fuso = usuario.fuso_horario
    inicio_utc, _ = tempo.limites_do_dia(inicio, fuso)
    _, fim_utc = tempo.limites_do_dia(fim, fuso)
    serie = defaultdict(lambda: {"xp": 0, "tarefas_concluidas": 0, "minutos_foco": 0})

    for criado_em, xp in db.execute(
        select(EventoXP.criado_em, EventoXP.xp).where(
            EventoXP.usuario_id == usuario.id, EventoXP.criado_em >= inicio_utc, EventoXP.criado_em < fim_utc
        )
    ):
        serie[tempo.dia_local(criado_em, fuso)]["xp"] += xp

    for (concluida_em,) in db.execute(
        select(Tarefa.data_conclusao).where(
            Tarefa.usuario_id == usuario.id,
            Tarefa.status == StatusTarefa.CONCLUIDA,
            Tarefa.data_conclusao >= inicio_utc,
            Tarefa.data_conclusao < fim_utc,
        )
    ):
        serie[tempo.dia_local(concluida_em, fuso)]["tarefas_concluidas"] += 1

    for iniciada_em, minutos in db.execute(
        select(SessaoFoco.iniciada_em, SessaoFoco.minutos_validos).where(
            SessaoFoco.usuario_id == usuario.id,
            SessaoFoco.tipo == TipoSessao.FOCO,
            SessaoFoco.iniciada_em >= inicio_utc,
            SessaoFoco.iniciada_em < fim_utc,
        )
    ):
        serie[tempo.dia_local(iniciada_em, fuso)]["minutos_foco"] += minutos

    return serie
