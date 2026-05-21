from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Tarefa, Usuario
from app.schemas import TarefaCreate, TarefaResponse
from app.security import get_usuario_logado

router = APIRouter()


# rota para criar uma tarefa do usuario logado
@router.post("/tarefas", response_model=TarefaResponse)
def criar_tarefa(
    tarefa: TarefaCreate,
    db: Session = Depends(get_db),
    usuario_logado: Usuario = Depends(get_usuario_logado)
):

    # cria uma nova tarefa vinculada ao usuario logado
    nova_tarefa = Tarefa(
        titulo=tarefa.titulo,
        descricao=tarefa.descricao,
        prioridade=tarefa.prioridade,
        xp_recompensa=tarefa.xp_recompensa,
        usuario_id=usuario_logado.id
    )

    db.add(nova_tarefa)
    db.commit()
    db.refresh(nova_tarefa)

    return nova_tarefa


# rota para listar as tarefas do usuario logado
@router.get("/tarefas", response_model=list[TarefaResponse])
def listar_tarefas(
    db: Session = Depends(get_db),
    usuario_logado: Usuario = Depends(get_usuario_logado)
):

    # busca apenas as tarefas do usuario autenticado
    tarefas = db.query(Tarefa).filter(
        Tarefa.usuario_id == usuario_logado.id
    ).all()

    return tarefas


# rota para concluir uma tarefa e adicionar xp ao usuario
@router.put("/tarefas/{tarefa_id}/concluir", response_model=TarefaResponse)
def concluir_tarefa(
    tarefa_id: int,
    db: Session = Depends(get_db),
    usuario_logado: Usuario = Depends(get_usuario_logado)
):

    tarefa = db.query(Tarefa).filter(
        Tarefa.id == tarefa_id,
        Tarefa.usuario_id == usuario_logado.id
    ).first()

    if not tarefa:
        raise HTTPException(
            status_code=404,
            detail="tarefa nao encontrada"
        )

    if tarefa.status == "concluida":
        raise HTTPException(
            status_code=400,
            detail="tarefa ja concluida"
        )

    tarefa.status = "concluida"
    usuario_logado.xp += tarefa.xp_recompensa

    # regra simples de nivel: a cada 100 xp sobe 1 nivel
    usuario_logado.nivel = (usuario_logado.xp // 100) + 1

    db.commit()
    db.refresh(tarefa)

    return tarefa