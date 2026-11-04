# configuracao dos testes: banco sqlite em memoria e relogio controlavel
import os
from datetime import datetime, timedelta

from cryptography.fernet import Fernet

# precisa vir antes de importar a aplicacao
os.environ.update(
    {
        "AMBIENTE": "teste",
        "DATABASE_URL": "sqlite://",
        "SECRET_KEY": "chave-de-teste-com-mais-de-trinta-e-dois-caracteres",
        "HUMOR_ENC_KEY": Fernet.generate_key().decode(),
        "RATE_LIMIT_ATIVO": "false",
    }
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core import tempo  # noqa: E402
from app.core.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def banco():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


class Relogio:
    """Substitui tempo.agora() para simular datas e a passagem do tempo (horario utc)."""

    def __init__(self, inicio: datetime):
        self.atual = inicio

    def __call__(self) -> datetime:
        return self.atual

    def avancar(self, **kwargs):
        self.atual += timedelta(**kwargs)


@pytest.fixture
def relogio(monkeypatch):
    # terca, 20/10/2026 15:00 utc = 12:00 em sao paulo
    r = Relogio(datetime(2026, 10, 20, 15, 0, 0))
    monkeypatch.setattr(tempo, "agora", r)
    return r


@pytest.fixture
def client():
    return TestClient(app)


DADOS_CADASTRO = {
    "nome": "Nayra",
    "email": "nayra@email.com",
    "senha": "senha-forte-123",
    "aceite_termos": True,
    "maior_de_idade": True,
}


def cadastrar(client: TestClient, **extra) -> dict:
    dados = {**DADOS_CADASTRO, **extra}
    resposta = client.post("/api/v1/auth/cadastro", json=dados, headers={"X-Cliente": "mobile"})
    assert resposta.status_code == 201, resposta.text
    corpo = resposta.json()
    return {"Authorization": f"Bearer {corpo['access_token']}", "_refresh": corpo["refresh_token"]}


@pytest.fixture
def auth(client, relogio) -> dict:
    headers = cadastrar(client)
    headers.pop("_refresh")
    return headers
