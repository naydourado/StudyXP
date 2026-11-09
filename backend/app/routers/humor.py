# registro de humor - dado sensivel: exige consentimento e a observacao fica criptografada
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.cripto import cifrar, decifrar
from app.core.database import get_db
from app.core.deps import get_usuario_atual
from app.core.erros import ErroAPI
from app.models import RegistroHumor, Usuario
from app.models.enums import OrigemXP
from app.schemas.atividades import HumorComXP, HumorCreate, HumorOut
from app.services.conquistas import verificar_conquistas
from app.services.consentimentos import consentiu_humor
from app.services.gamificacao import registrar_xp, xp_para_registro_de_humor
from app.services.resposta import resultado_xp

router = APIRouter(prefix="/humor", tags=["humor"])


def _exigir_consentimento(db: Session, usuario: Usuario) -> None:
    if not consentiu_humor(db, usuario.id):
        raise ErroAPI(403, "Autorize o uso dos dados de humor para continuar.", "consentimento_necessario")


def _saida(registro: RegistroHumor) -> dict:
    return {
        "id": registro.id,
        "humor": registro.humor,
        "observacao": decifrar(registro.observacao_cifrada),
        "criado_em": registro.criado_em,
    }


@router.get("", response_model=list[HumorOut])
def listar(
    limite: int = Query(30, ge=1, le=100),
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    _exigir_consentimento(db, usuario)
    registros = db.scalars(
        select(RegistroHumor)
        .where(RegistroHumor.usuario_id == usuario.id)
        .order_by(RegistroHumor.criado_em.desc(), RegistroHumor.id.desc())
        .limit(limite)
    ).all()
    return [_saida(r) for r in registros]


@router.post("", response_model=HumorComXP, status_code=201)
def registrar(dados: HumorCreate, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    _exigir_consentimento(db, usuario)

    xp = xp_para_registro_de_humor(db, usuario)
    registro = RegistroHumor(
        usuario_id=usuario.id,
        humor=dados.humor,
        observacao_cifrada=cifrar(dados.observacao or None),
    )
    db.add(registro)
    db.flush()
    registrar_xp(db, usuario, OrigemXP.HUMOR, registro.id, xp)
    novas = verificar_conquistas(db, usuario)
    db.commit()

    return {"registro": _saida(registro), **resultado_xp(usuario, xp, novas)}


@router.delete("/{registro_id}", status_code=204)
def excluir(registro_id: int, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    registro = db.scalar(
        select(RegistroHumor).where(RegistroHumor.id == registro_id, RegistroHumor.usuario_id == usuario.id)
    )
    if registro is None:
        raise ErroAPI(404, "Registro não encontrado.", "registro_nao_encontrado")
    db.delete(registro)
    db.commit()
    return Response(status_code=204)


@router.delete("", status_code=204)
def excluir_todos(usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    db.execute(delete(RegistroHumor).where(RegistroHumor.usuario_id == usuario.id))
    db.commit()
    return Response(status_code=204)
