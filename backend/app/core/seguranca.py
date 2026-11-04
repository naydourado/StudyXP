# hash de senha (argon2), tokens jwt de acesso e refresh tokens com rotacao
import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core import tempo
from app.core.config import get_settings
from app.core.erros import ErroAPI
from app.models import RefreshToken

ALGORITMO = "HS256"
JANELA_CONCORRENCIA_SEGUNDOS = 10

_hasher = PasswordHash.recommended()

# hash usado para gastar o mesmo tempo quando o e-mail nao existe no login
# (evita descobrir quais e-mails tem conta pelo tempo de resposta)
_HASH_FALSO = _hasher.hash("senha-que-nao-existe")


def gerar_hash_senha(senha: str) -> str:
    return _hasher.hash(senha)


def verificar_senha(senha: str, senha_hash: str | None) -> bool:
    if senha_hash is None:
        _hasher.verify(senha, _HASH_FALSO)
        return False
    return _hasher.verify(senha, senha_hash)


def criar_access_token(usuario_id: int) -> str:
    settings = get_settings()
    # relogio real: a validade do jwt e conferida pela biblioteca com o horario do sistema
    agora = datetime.now(UTC)
    dados = {
        "sub": str(usuario_id),
        "tipo": "access",
        "iat": agora,
        "exp": agora + timedelta(minutes=settings.access_token_minutos),
    }
    return jwt.encode(dados, settings.secret_key, algorithm=ALGORITMO)


def ler_access_token(token: str) -> int:
    try:
        dados = jwt.decode(token, get_settings().secret_key, algorithms=[ALGORITMO])
    except jwt.ExpiredSignatureError:
        raise ErroAPI(401, "Sessão expirada.", "token_expirado") from None
    except jwt.InvalidTokenError:
        raise ErroAPI(401, "Token inválido.", "token_invalido") from None

    if dados.get("tipo") != "access" or not str(dados.get("sub", "")).isdigit():
        raise ErroAPI(401, "Token inválido.", "token_invalido")

    return int(dados["sub"])


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def emitir_refresh_token(
    db: Session, usuario_id: int, familia: str | None = None, dispositivo: str | None = None
) -> str:
    token = secrets.token_urlsafe(48)
    db.add(
        RefreshToken(
            usuario_id=usuario_id,
            token_hash=hash_token(token),
            familia=familia or str(uuid.uuid4()),
            expira_em=tempo.agora() + timedelta(days=get_settings().refresh_token_dias),
            dispositivo=(dispositivo or "")[:200] or None,
        )
    )
    return token


# troca um refresh token valido por um novo (o antigo deixa de valer)
def rotacionar_refresh_token(db: Session, token: str, dispositivo: str | None = None) -> tuple[int, str]:
    registro = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(token)))
    agora = tempo.agora()

    if registro is None:
        raise ErroAPI(401, "Sessão inválida.", "refresh_invalido")

    if registro.revogado_em is not None:
        # duas abas renovando ao mesmo tempo: nao e roubo, o cliente tenta de novo
        if agora - registro.revogado_em <= timedelta(seconds=JANELA_CONCORRENCIA_SEGUNDOS):
            raise ErroAPI(401, "Sessão renovada em outra aba.", "refresh_concorrente")
        # token ja usado de novo: possivel roubo, derruba a sessao inteira
        revogar_familia(db, registro.familia)
        db.commit()
        raise ErroAPI(401, "Sessão inválida.", "refresh_reutilizado")

    if registro.expira_em <= agora:
        raise ErroAPI(401, "Sessão expirada.", "refresh_expirado")

    registro.revogado_em = agora
    novo = emitir_refresh_token(db, registro.usuario_id, registro.familia, dispositivo)
    return registro.usuario_id, novo


def revogar_refresh_token(db: Session, token: str) -> None:
    registro = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(token)))
    if registro is not None and registro.revogado_em is None:
        registro.revogado_em = tempo.agora()


def revogar_familia(db: Session, familia: str) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.familia == familia, RefreshToken.revogado_em.is_(None))
        .values(revogado_em=tempo.agora())
    )


# usado na troca de senha e na exclusao da conta: desloga todos os dispositivos
def revogar_todos_do_usuario(db: Session, usuario_id: int) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.usuario_id == usuario_id, RefreshToken.revogado_em.is_(None))
        .values(revogado_em=tempo.agora())
    )
