# adequacao a lgpd: minimizacao, exportacao completa, novo aceite de termos e links nos e-mails
from app.core.config import get_settings
from app.services import email
from tests.conftest import DADOS_CADASTRO, cadastrar

API = "/api/v1"


def test_sessao_guarda_so_o_tipo_de_acesso_e_nao_o_navegador(client, relogio):
    cadastrar(client)  # cadastro feito como app (X-Cliente: mobile)
    client.post(
        f"{API}/auth/login",
        json={"email": DADOS_CADASTRO["email"], "senha": DADOS_CADASTRO["senha"]},
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/150"},
    )
    auth = cadastrar(client, email="outra@email.com")
    dados = client.get(f"{API}/me/exportar", headers=auth).json()
    assert [s["tipo"] for s in dados["sessoes"]] == ["app"]

    from app.core.database import SessionLocal
    from app.models import RefreshToken

    with SessionLocal() as db:
        tipos = {r.dispositivo for r in db.query(RefreshToken).all()}
    assert tipos == {"app", "web"}
    assert not any("Mozilla" in (t or "") for t in tipos)


def test_exportacao_traz_todos_os_dados_do_titular(client, relogio):
    auth = cadastrar(client)
    client.post(f"{API}/auth/login", json={"email": DADOS_CADASTRO["email"], "senha": DADOS_CADASTRO["senha"]})
    client.post(
        f"{API}/me/dispositivos", json={"token": "ExponentPushToken[x1]", "plataforma": "android"}, headers=auth
    )

    dados = client.get(f"{API}/me/exportar", headers=auth).json()

    for chave in (
        "usuario",
        "preferencias",
        "tarefas",
        "sessoes_foco",
        "registros_humor",
        "eventos_xp",
        "conquistas",
        "consentimentos",
        "acessos",
        "sessoes",
        "dispositivos_notificacao",
        "termos",
    ):
        assert chave in dados, chave
    assert len(dados["acessos"]) == 1
    assert dados["dispositivos_notificacao"][0]["plataforma"] == "android"
    assert dados["termos"]["versao_aceita"] == get_settings().termos_versao


def test_nova_versao_dos_termos_exige_novo_aceite(client, relogio, monkeypatch):
    auth = cadastrar(client)
    assert client.get(f"{API}/me", headers=auth).json()["termos_pendentes"] is False

    monkeypatch.setattr(get_settings(), "termos_versao", "2027-01")
    assert client.get(f"{API}/me", headers=auth).json()["termos_pendentes"] is True

    resposta = client.post(f"{API}/me/aceitar-termos", headers=auth).json()
    assert resposta["termos_pendentes"] is False
    assert resposta["termos_versao"] == "2027-01"

    consentimentos = client.get(f"{API}/me/exportar", headers=auth).json()["consentimentos"]
    assert [(c["tipo"], c["versao"]) for c in consentimentos] == [("termos", "2026-10"), ("termos", "2027-01")]


def test_emails_tem_link_da_politica_e_para_parar_de_receber():
    redefinicao = email.email_redefinicao_senha("a@b.com", "Ana", "http://site/redefinir-senha?token=x")
    resumo = email.email_resumo_semanal(
        "a@b.com", "Ana", {"xp": 10, "tarefas": 1, "minutos_foco": 25, "ofensiva": 1, "nivel": 1}
    )
    site = get_settings().web_url
    assert f"{site}/privacidade" in redefinicao.html
    assert f"{site}/privacidade" in resumo.html
    assert f"{site}/configuracoes" in resumo.html
    assert f"{site}/configuracoes" in resumo.texto
