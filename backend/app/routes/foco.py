from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario, SessaoFoco
from app.schemas import FocoCreate, FocoResponse
from app.security import get_usuario_logado

router = APIRouter()


@router.post("/foco", response_model=FocoResponse, status_code=201)
def registrar_foco(
    dados: FocoCreate,
    db: Session = Depends(get_db),
    usuario_logado: Usuario = Depends(get_usuario_logado)
):

    nova_sessao = SessaoFoco(
        tempo_minutos=dados.tempo_minutos,
        usuario_id=usuario_logado.id
    )

    db.add(nova_sessao)
    db.commit()
    db.refresh(nova_sessao)

    return nova_sessao


@router.get("/foco", response_model=list[FocoResponse])
def listar_foco(
    db: Session = Depends(get_db),
    usuario_logado: Usuario = Depends(get_usuario_logado)
):

    sessoes = db.query(SessaoFoco).filter(
        SessaoFoco.usuario_id == usuario_logado.id
    ).all()

    return sessoes