# envio real de e-mail (resend) e push (expo) com a chamada http simulada
import httpx
import pytest

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models import DispositivoPush
from app.services import email, push
from tests.conftest import cadastrar


class RespostaFalsa:
    def __init__(self, dados, status=200):
        self.dados = dados
        self.status_code = status

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("erro", request=None, response=None)

    def json(self):
        return self.dados


class Registro(list):
    resposta = RespostaFalsa({})


@pytest.fixture
def chamadas(monkeypatch):
    registro = Registro()

    def post_falso(url, **kwargs):
        registro.append((url, kwargs))
        return registro.resposta

    monkeypatch.setattr(httpx, "post", post_falso)
    return registro


def test_resend_envia_com_chave_e_remetente(monkeypatch, chamadas):
    settings = get_settings()
    monkeypatch.setattr(settings, "email_provedor", "resend")
    monkeypatch.setattr(settings, "resend_api_key", "re_teste")

    ok = email.enviar_email(email.Email("aluno@email.com", "Assunto", "texto", "<p>html</p>"))

    assert ok is True
    url, kwargs = chamadas[0]
    assert url == "https://api.resend.com/emails"
    assert kwargs["headers"]["Authorization"] == "Bearer re_teste"
    assert kwargs["json"]["to"] == ["aluno@email.com"]


def test_falha_no_resend_nao_derruba_a_requisicao(monkeypatch, chamadas):
    monkeypatch.setattr(get_settings(), "email_provedor", "resend")
    chamadas.resposta = RespostaFalsa({}, status=500)
    assert email.enviar_email(email.Email("a@b.com", "x", "y", "z")) is False


def test_push_expo_remove_aparelho_desinstalado(client, relogio, monkeypatch, chamadas):
    monkeypatch.setattr(get_settings(), "push_provedor", "expo")
    auth = cadastrar(client)
    for token in ("ExponentPushToken[valido]", "ExponentPushToken[velho]"):
        client.post("/api/v1/me/dispositivos", json={"token": token, "plataforma": "android"}, headers=auth)

    chamadas.resposta = RespostaFalsa(
        {
            "data": [
                {"status": "ok", "id": "1"},
                {"status": "error", "details": {"error": "DeviceNotRegistered"}},
            ]
        }
    )
    with SessionLocal() as db:
        enviados = push.enviar_push(
            db,
            [
                push.Notificacao("ExponentPushToken[valido]", "t", "c"),
                push.Notificacao("ExponentPushToken[velho]", "t", "c"),
            ],
        )
        db.commit()
        restantes = [d.token for d in db.query(DispositivoPush).all()]

    assert enviados == 1
    assert restantes == ["ExponentPushToken[valido]"]
    assert chamadas[0][0] == push.URL_EXPO_PUSH
