# dados agregados para as telas: dashboard, progresso, status de gamificacao e conquistas
from datetime import date, timedelta
from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.core import tempo
from app.core.database import get_db
from app.core.deps import get_usuario_atual
from app.models import RegistroHumor, SessaoFoco, Tarefa, Usuario, UsuarioConquista
from app.models.enums import StatusSessao, StatusTarefa, TipoSessao
from app.schemas.comum import ConquistaOut, StatusGamificacao
from app.services.conquistas import CATALOGO
from app.services.consentimentos import consentiu_humor
from app.services.estatisticas import serie_por_dia
from app.services.resposta import conquista_out, status_gamificacao

router = APIRouter(tags=["painel"])

DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"]


@router.get("/gamificacao/status", response_model=StatusGamificacao)
def ler_status(usuario: Usuario = Depends(get_usuario_atual)):
    return status_gamificacao(usuario)


@router.get("/conquistas", response_model=list[ConquistaOut])
def listar_conquistas(usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    desbloqueios = {
        c.codigo: c.desbloqueada_em
        for c in db.scalars(select(UsuarioConquista).where(UsuarioConquista.usuario_id == usuario.id))
    }
    return [conquista_out(c, desbloqueios.get(c.codigo), c.codigo in desbloqueios) for c in CATALOGO]


@router.get("/progresso")
def progresso(
    periodo: Literal["semana", "mes"] = "semana",
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    hoje = tempo.dia_local(tempo.agora(), usuario.fuso_horario)
    dias = 7 if periodo == "semana" else 30
    inicio = hoje - timedelta(days=dias - 1)
    serie = serie_por_dia(db, usuario, inicio, hoje)

    tarefas_total = db.scalar(
        select(func.count(Tarefa.id)).where(Tarefa.usuario_id == usuario.id, Tarefa.status == StatusTarefa.CONCLUIDA)
    )
    minutos_total = db.scalar(
        select(func.sum(SessaoFoco.minutos_validos)).where(
            SessaoFoco.usuario_id == usuario.id, SessaoFoco.tipo == TipoSessao.FOCO
        )
    )

    return {
        "periodo": periodo,
        "totais": {
            "xp_total": usuario.xp,
            "minutos_foco": minutos_total or 0,
            "tarefas_concluidas": tarefas_total or 0,
        },
        "gamificacao": status_gamificacao(usuario),
        "serie": [
            {
                "data": dia,
                "dia_semana": DIAS_SEMANA[(dia.weekday() + 1) % 7],
                **serie[dia],
            }
            for dia in (inicio + timedelta(days=i) for i in range(dias))
        ],
    }


@router.get("/dashboard")
def dashboard(usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    fuso = usuario.fuso_horario
    hoje = tempo.dia_local(tempo.agora(), fuso)
    inicio_hoje, fim_hoje = tempo.limites_do_dia(hoje, fuso)

    pendentes = db.scalars(
        select(Tarefa)
        .where(Tarefa.usuario_id == usuario.id, Tarefa.status == StatusTarefa.PENDENTE)
        .order_by(case((Tarefa.data_prazo.is_(None), 1), else_=0), Tarefa.data_prazo, Tarefa.criado_em.desc())
        .limit(5)
    ).all()
    concluidas_hoje = db.scalars(
        select(Tarefa)
        .where(
            Tarefa.usuario_id == usuario.id,
            Tarefa.status == StatusTarefa.CONCLUIDA,
            Tarefa.data_conclusao >= inicio_hoje,
            Tarefa.data_conclusao < fim_hoje,
        )
        .order_by(Tarefa.data_conclusao.desc())
        .limit(5)
    ).all()

    # semana de domingo a sabado, como no prototipo
    domingo = hoje - timedelta(days=(hoje.weekday() + 1) % 7)
    serie = serie_por_dia(db, usuario, domingo, domingo + timedelta(days=6))
    semana = [
        {
            "data": dia,
            "dia_semana": DIAS_SEMANA[i],
            "ativo": serie[dia]["tarefas_concluidas"] > 0 or _teve_foco_completo(db, usuario, dia),
        }
        for i, dia in enumerate(domingo + timedelta(days=n) for n in range(7))
    ]

    ultimo_humor = None
    humor_autorizado = consentiu_humor(db, usuario.id)
    if humor_autorizado:
        registro = db.scalar(
            select(RegistroHumor)
            .where(RegistroHumor.usuario_id == usuario.id)
            .order_by(RegistroHumor.criado_em.desc(), RegistroHumor.id.desc())
            .limit(1)
        )
        if registro:
            ultimo_humor = {"humor": registro.humor, "criado_em": registro.criado_em}

    return {
        "usuario": {"nome": usuario.nome},
        "gamificacao": status_gamificacao(usuario),
        "tarefas": [
            {
                "id": t.id,
                "titulo": t.titulo,
                "prioridade": t.prioridade,
                "status": t.status,
                "data_prazo": t.data_prazo,
                "xp_recompensa": t.xp_recompensa,
            }
            for t in [*pendentes, *concluidas_hoje]
        ],
        "semana": semana,
        "foco_hoje_minutos": serie[hoje]["minutos_foco"],
        "humor_autorizado": humor_autorizado,
        "ultimo_humor": ultimo_humor,
    }


def _teve_foco_completo(db: Session, usuario: Usuario, dia: date) -> bool:
    inicio, fim = tempo.limites_do_dia(dia, usuario.fuso_horario)
    return bool(
        db.scalar(
            select(func.count(SessaoFoco.id)).where(
                SessaoFoco.usuario_id == usuario.id,
                SessaoFoco.tipo == TipoSessao.FOCO,
                SessaoFoco.status == StatusSessao.CONCLUIDA,
                SessaoFoco.finalizada_em >= inicio,
                SessaoFoco.finalizada_em < fim,
            )
        )
    )
