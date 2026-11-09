from datetime import timedelta
from typing import Literal

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import case, select
from sqlalchemy.orm import Session

from app.core import tempo
from app.core.database import get_db
from app.core.deps import get_usuario_atual
from app.core.erros import ErroAPI
from app.models import Tarefa, Usuario
from app.models.enums import OrigemXP, StatusTarefa
from app.schemas.atividades import TarefaComXP, TarefaCreate, TarefaOut, TarefaUpdate
from app.services.conquistas import verificar_conquistas
from app.services.gamificacao import XP_POR_PRIORIDADE, registrar_xp, xp_para_conclusao_de_tarefa
from app.services.ofensiva import registrar_dia_ativo
from app.services.resposta import resultado_xp

router = APIRouter(prefix="/tarefas", tags=["tarefas"])


# so encontra tarefas do proprio usuario: recurso de outra pessoa responde 404
def _buscar(db: Session, usuario: Usuario, tarefa_id: int) -> Tarefa:
    tarefa = db.scalar(select(Tarefa).where(Tarefa.id == tarefa_id, Tarefa.usuario_id == usuario.id))
    if tarefa is None:
        raise ErroAPI(404, "Tarefa não encontrada.", "tarefa_nao_encontrada")
    return tarefa


@router.get("", response_model=list[TarefaOut])
def listar(
    status: StatusTarefa | None = None,
    prazo: Literal["hoje", "atrasadas", "semana"] | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    consulta = select(Tarefa).where(Tarefa.usuario_id == usuario.id)

    if status is not None:
        consulta = consulta.where(Tarefa.status == status)

    if prazo is not None:
        hoje = tempo.dia_local(tempo.agora(), usuario.fuso_horario)
        if prazo == "hoje":
            consulta = consulta.where(Tarefa.data_prazo <= hoje)
        elif prazo == "atrasadas":
            consulta = consulta.where(Tarefa.data_prazo < hoje, Tarefa.status == StatusTarefa.PENDENTE)
        else:
            consulta = consulta.where(Tarefa.data_prazo <= hoje + timedelta(days=7))

    # pendentes primeiro, por prazo (sem prazo no fim), depois as mais recentes
    consulta = consulta.order_by(
        case((Tarefa.status == StatusTarefa.PENDENTE, 0), else_=1),
        case((Tarefa.data_prazo.is_(None), 1), else_=0),
        Tarefa.data_prazo,
        Tarefa.criado_em.desc(),
    )
    return db.scalars(consulta.offset((page - 1) * size).limit(size)).all()


@router.post("", response_model=TarefaOut, status_code=201)
def criar(dados: TarefaCreate, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    tarefa = Tarefa(
        usuario_id=usuario.id,
        titulo=dados.titulo,
        descricao=dados.descricao or None,
        prioridade=dados.prioridade,
        data_prazo=dados.data_prazo,
        xp_recompensa=XP_POR_PRIORIDADE[dados.prioridade],
    )
    db.add(tarefa)
    db.commit()
    return tarefa


@router.get("/{tarefa_id}", response_model=TarefaOut)
def detalhar(tarefa_id: int, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    return _buscar(db, usuario, tarefa_id)


@router.patch("/{tarefa_id}", response_model=TarefaOut)
def editar(
    tarefa_id: int,
    dados: TarefaUpdate,
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    tarefa = _buscar(db, usuario, tarefa_id)
    enviados = dados.model_dump(exclude_unset=True)

    if "titulo" in enviados and dados.titulo is not None:
        tarefa.titulo = dados.titulo
    if "descricao" in enviados:
        tarefa.descricao = dados.descricao or None
    if "data_prazo" in enviados and dados.data_prazo != tarefa.data_prazo:
        tarefa.data_prazo = dados.data_prazo
        # prazo novo: os lembretes voltam a valer
        tarefa.lembrete_vespera_em = None
        tarefa.lembrete_dia_em = None
    if "prioridade" in enviados and dados.prioridade is not None:
        tarefa.prioridade = dados.prioridade
        # o valor so muda enquanto pendente; o xp ja concedido fica no extrato
        if tarefa.status == StatusTarefa.PENDENTE:
            tarefa.xp_recompensa = XP_POR_PRIORIDADE[dados.prioridade]

    db.commit()
    return tarefa


@router.delete("/{tarefa_id}", status_code=204)
def excluir(tarefa_id: int, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    db.delete(_buscar(db, usuario, tarefa_id))
    db.commit()
    return Response(status_code=204)


@router.post("/{tarefa_id}/concluir", response_model=TarefaComXP)
def concluir(tarefa_id: int, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    tarefa = _buscar(db, usuario, tarefa_id)
    if tarefa.status == StatusTarefa.CONCLUIDA:
        raise ErroAPI(409, "A tarefa já está concluída.", "tarefa_ja_concluida")

    xp = xp_para_conclusao_de_tarefa(db, usuario, tarefa.xp_recompensa)

    tarefa.status = StatusTarefa.CONCLUIDA
    tarefa.data_conclusao = tempo.agora()
    tarefa.xp_concedido = xp
    registrar_xp(db, usuario, OrigemXP.TAREFA, tarefa.id, xp)
    registrar_dia_ativo(usuario)
    novas = verificar_conquistas(db, usuario)
    db.commit()

    return {"tarefa": tarefa, **resultado_xp(usuario, xp, novas)}


@router.post("/{tarefa_id}/reabrir", response_model=TarefaComXP)
def reabrir(tarefa_id: int, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    tarefa = _buscar(db, usuario, tarefa_id)
    if tarefa.status != StatusTarefa.CONCLUIDA:
        raise ErroAPI(409, "A tarefa não está concluída.", "tarefa_nao_concluida")

    # estorna o xp que a conclusao deu
    estorno = -tarefa.xp_concedido
    registrar_xp(db, usuario, OrigemXP.TAREFA, tarefa.id, estorno)

    tarefa.status = StatusTarefa.PENDENTE
    tarefa.data_conclusao = None
    tarefa.xp_concedido = 0
    tarefa.xp_recompensa = XP_POR_PRIORIDADE[tarefa.prioridade]
    db.commit()

    return {"tarefa": tarefa, **resultado_xp(usuario, estorno, [])}
