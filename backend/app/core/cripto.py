# criptografia simetrica (fernet) para dados sensiveis, como a observacao do humor
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings


def _fernet() -> Fernet:
    return Fernet(get_settings().humor_enc_key.encode())


def cifrar(texto: str | None) -> str | None:
    if texto is None:
        return None
    return _fernet().encrypt(texto.encode()).decode()


def decifrar(cifrado: str | None) -> str | None:
    if cifrado is None:
        return None
    try:
        return _fernet().decrypt(cifrado.encode()).decode()
    except InvalidToken:
        # chave trocada ou dado corrompido: nao derruba a requisicao
        return None
