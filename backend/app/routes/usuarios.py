from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioCreate, UsuarioResponse

# APIRouter() - separa rotas por arquivo
router = APIRouter()


# rota post para cadastrar usuario
@router.post(
    "/usuarios",

    # define o schema de resposta da api
    response_model=UsuarioResponse
)
def criar_usuario(

    # recebe e valida os dados enviados
    usuario: UsuarioCreate,

    # abre conexao com o banco e declara dependencia de conexão
    db: Session = Depends(get_db)
):

    # cria um objeto usuario usando os dados recebidos
    novo_usuario = Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha=usuario.senha
    )

    # adiciona o objeto na sessao do banco
    db.add(novo_usuario)

    # salva definitivamente no mysql
    db.commit()

    # atualiza o objeto com dados gerados pelo banco
    # ex: id e data de criacao
    db.refresh(novo_usuario)

    # retorna o usuario criado
    return novo_usuario