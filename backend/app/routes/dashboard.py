from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Usuario, Tarefa, RegistroHumor, SessaoFoco
from app.security import get_usuario_logado

# agrupador de rotas do dashboard
router = APIRouter()


# rota para exibir o resumo do progresso do usuario
@router.get("/dashboard")
def buscar_dashboard(
    db: Session = Depends(get_db),
    usuario_logado: Usuario = Depends(get_usuario_logado)
):

    # conta todas as tarefas do usuario logado
    total_tarefas = db.query(Tarefa).filter(
        Tarefa.usuario_id == usuario_logado.id
    ).count()

    # conta as tarefas concluidas
    tarefas_concluidas = db.query(Tarefa).filter(
        Tarefa.usuario_id == usuario_logado.id,
        Tarefa.status == "concluida"
    ).count()

    # conta as tarefas pendentes
    tarefas_pendentes = db.query(Tarefa).filter(
        Tarefa.usuario_id == usuario_logado.id,
        Tarefa.status == "pendente"
    ).count()

    # calcula percentual de conclusao
    if total_tarefas > 0:
        progresso = (tarefas_concluidas / total_tarefas) * 100
    else:
        progresso = 0

    # soma o tempo total estudado nas sessoes de foco
    tempo_total_foco = db.query(
        func.sum(SessaoFoco.tempo_minutos)
    ).filter(
        SessaoFoco.usuario_id == usuario_logado.id
    ).scalar()

    # se nao houver sessoes, considera 0
    if tempo_total_foco is None:
        tempo_total_foco = 0

    # busca o ultimo humor registrado pelo usuario
    ultimo_humor = db.query(RegistroHumor).filter(
        RegistroHumor.usuario_id == usuario_logado.id
    ).order_by(
        RegistroHumor.data_registro.desc()
    ).first()

    # retorna os dados para o dashboard
    return {
        "usuario": usuario_logado.nome,
        "xp": usuario_logado.xp,
        "nivel": usuario_logado.nivel,
        "total_tarefas": total_tarefas,
        "tarefas_concluidas": tarefas_concluidas,
        "tarefas_pendentes": tarefas_pendentes,
        "progresso": round(progresso, 2),
        "tempo_total_foco": tempo_total_foco,
        "ultimo_humor": ultimo_humor.humor if ultimo_humor else None
    }