from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario


# configura a rota usada para obter o token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)


# funcao responsavel por identificar o usuario logado pelo token
def get_usuario_logado(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    try:
        # decodifica o token usando a chave secreta e o algoritmo
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # pega o id do usuario que foi salvo no token
        usuario_id = payload.get("sub")

        # se o token nao tiver id, retorna erro
        if usuario_id is None:
            raise HTTPException(
                status_code=401,
                detail="token invalido"
            )

    except JWTError:
        # se o token estiver invalido ou expirado, retorna erro
        raise HTTPException(
            status_code=401,
            detail="token invalido ou expirado"
        )

    # busca o usuario no banco pelo id salvo no token
    usuario = db.query(Usuario).filter(
        Usuario.id == int(usuario_id)
    ).first()

    # se o usuario nao existir mais, retorna erro
    if usuario is None:
        raise HTTPException(
            status_code=401,
            detail="usuario nao encontrado"
        )

    # retorna o usuario logado
    return usuario


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))


# configura o algoritmo usado para criptografar as senhas
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# funcao responsavel por gerar o hash da senha
def gerar_hash_senha(senha: str):

    # retorna a senha criptografada
    return pwd_context.hash(senha)


# funcao responsavel por verificar se a senha digitada bate com o hash salvo
def verificar_senha(senha: str, senha_hash: str):

    # compara a senha digitada com a senha criptografada
    return pwd_context.verify(senha, senha_hash)


# funcao responsavel por criar o token de acesso
def criar_token_acesso(dados: dict):

    # copia os dados que serao colocados dentro do token
    dados_token = dados.copy()

    # define quando o token vai expirar
    expiracao = datetime.now(UTC) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # adiciona a data de expiracao no token
    dados_token.update({"exp": expiracao})

    # gera o token jwt
    token = jwt.encode(
        dados_token,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    # retorna o token gerado
    return token