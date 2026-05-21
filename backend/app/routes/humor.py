from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario, RegistroHumor
from app.schemas import HumorCreate, HumorResponse
from app.security import get_usuario_logado

router = APIRouter()


# rota para registrar humor do usuario logado
@router.post("/humor", response_model=HumorResponse, status_code=201)
def registrar_humor(

    # recebe e valida os dados enviados
    dados: HumorCreate,

    # abre conexao com o banco
    db: Session = Depends(get_db),

    # identifica o usuario autenticado pelo token
    usuario_logado: Usuario = Depends(get_usuario_logado)
):

    # cria um novo registro de humor
    novo_humor = RegistroHumor(

        # salva o humor escolhido
        humor=dados.humor,

        # salva observacao opcional
        observacao=dados.observacao,

        # vincula o registro ao usuario logado
        usuario_id=usuario_logado.id
    )

    # adiciona o registro na sessao do banco
    db.add(novo_humor)

    # salva definitivamente no mysql
    db.commit()

    # atualiza o objeto com dados gerados pelo banco
    # ex: id e data de registro
    db.refresh(novo_humor)

    # retorna o registro criado
    return novo_humor


# rota para listar os registros de humor do usuario logado
@router.get("/humor", response_model=list[HumorResponse])
def listar_humor(

    # abre conexao com o banco
    db: Session = Depends(get_db),

    # identifica o usuario autenticado
    usuario_logado: Usuario = Depends(get_usuario_logado)
):

    # busca apenas os registros pertencentes ao usuario logado
    registros = db.query(RegistroHumor).filter(
        RegistroHumor.usuario_id == usuario_logado.id
    ).all()

    # retorna a lista de registros
    return registros