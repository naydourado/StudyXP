# dependencias reutilizadas pelas rotas
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.erros import ErroAPI
from app.core.seguranca import ler_access_token
from app.models import Usuario

_bearer = HTTPBearer(auto_error=False)


# identifica o usuario pelo header Authorization: Bearer <token>
def get_usuario_atual(
    credenciais: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    if credenciais is None or credenciais.scheme.lower() != "bearer":
        raise ErroAPI(401, "Faça login para continuar.", "nao_autenticado", {"WWW-Authenticate": "Bearer"})

    usuario = db.get(Usuario, ler_access_token(credenciais.credentials))
    if usuario is None:
        raise ErroAPI(401, "Faça login para continuar.", "nao_autenticado", {"WWW-Authenticate": "Bearer"})

    return usuario
