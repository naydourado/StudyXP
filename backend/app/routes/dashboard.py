from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario, Tarefa
from app.security import get_usuario_logado

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

    # retorna os dados para o dashboard
    return {
        "usuario": usuario_logado.nome,
        "xp": usuario_logado.xp,
        "nivel": usuario_logado.nivel,
        "total_tarefas": total_tarefas,
        "tarefas_concluidas": tarefas_concluidas,
        "tarefas_pendentes": tarefas_pendentes,
        "progresso": round(progresso, 2)
    }