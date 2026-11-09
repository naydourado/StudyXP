from app.core.rate_limit import limiter
from tests.conftest import DADOS_CADASTRO, cadastrar

API = "/api/v1"


def test_cadastro_exige_termos_e_maioridade(client, relogio):
    sem_termos = {**DADOS_CADASTRO, "aceite_termos": False}
    assert client.post(f"{API}/auth/cadastro", json=sem_termos).json()["code"] == "termos_obrigatorios"

    menor = {**DADOS_CADASTRO, "maior_de_idade": False}
    assert client.post(f"{API}/auth/cadastro", json=menor).json()["code"] == "idade_minima"


def test_cadastro_valida_senha_curta_e_email_duplicado(client, relogio):
    curta = {**DADOS_CADASTRO, "senha": "123"}
    resposta = client.post(f"{API}/auth/cadastro", json=curta)
    assert resposta.status_code == 422
    assert resposta.json()["code"] == "validacao"

    cadastrar(client)
    duplicado = {**DADOS_CADASTRO, "email": "NAYRA@email.com"}
    assert client.post(f"{API}/auth/cadastro", json=duplicado).status_code == 409


def test_login_web_usa_cookie_e_mobile_recebe_refresh_no_corpo(client, relogio):
    cadastrar(client)
    login = {"email": DADOS_CADASTRO["email"], "senha": DADOS_CADASTRO["senha"]}

    web = client.post(f"{API}/auth/login", json=login)
    assert web.status_code == 200
    assert web.json()["refresh_token"] is None
    cookie = web.headers["set-cookie"]
    assert "studyxp_refresh=" in cookie and "HttpOnly" in cookie

    mobile = client.post(f"{API}/auth/login", json=login, headers={"X-Cliente": "mobile"})
    assert mobile.json()["refresh_token"]


def test_login_invalido_tem_mesma_resposta(client, relogio):
    cadastrar(client)
    senha_errada = client.post(f"{API}/auth/login", json={"email": DADOS_CADASTRO["email"], "senha": "x"})
    sem_conta = client.post(f"{API}/auth/login", json={"email": "ninguem@email.com", "senha": "x"})
    assert senha_errada.status_code == sem_conta.status_code == 401
    assert senha_errada.json() == sem_conta.json()


def test_rotas_privadas_exigem_token(client):
    assert client.get(f"{API}/me").status_code == 401
    assert client.get(f"{API}/me", headers={"Authorization": "Bearer lixo"}).json()["code"] == "token_invalido"


def test_refresh_rotaciona_e_detecta_reuso(client, relogio):
    refresh = cadastrar(client)["_refresh"]
    mobile = {"X-Cliente": "mobile"}

    primeira = client.post(f"{API}/auth/refresh", json={"refresh_token": refresh}, headers=mobile)
    assert primeira.status_code == 200
    novo = primeira.json()["refresh_token"]
    assert novo != refresh

    # reuso logo em seguida (outra aba) nao derruba a sessao
    concorrente = client.post(f"{API}/auth/refresh", json={"refresh_token": refresh}, headers=mobile)
    assert concorrente.json()["code"] == "refresh_concorrente"

    # reutilizar o token antigo depois disso derruba a sessao inteira, inclusive o novo
    relogio.avancar(minutes=1)
    reuso = client.post(f"{API}/auth/refresh", json={"refresh_token": refresh}, headers=mobile)
    assert reuso.json()["code"] == "refresh_reutilizado"
    assert client.post(f"{API}/auth/refresh", json={"refresh_token": novo}, headers=mobile).status_code == 401


def test_logout_revoga_refresh(client, relogio):
    refresh = cadastrar(client)["_refresh"]
    assert client.post(f"{API}/auth/logout", json={"refresh_token": refresh}).status_code == 204
    resposta = client.post(f"{API}/auth/refresh", json={"refresh_token": refresh}, headers={"X-Cliente": "mobile"})
    assert resposta.status_code == 401


def test_editar_perfil_e_trocar_senha(client, auth):
    resposta = client.patch(f"{API}/me", json={"nome": "Nayra D.", "bio": "Estudante de ADS"}, headers=auth)
    assert resposta.json()["bio"] == "Estudante de ADS"

    assert client.patch(f"{API}/me", json={"fuso_horario": "Marte/Base"}, headers=auth).status_code == 422

    errada = client.put(f"{API}/me/senha", json={"senha_atual": "x", "nova_senha": "nova-senha-123"}, headers=auth)
    assert errada.json()["code"] == "senha_incorreta"
    certa = client.put(
        f"{API}/me/senha", json={"senha_atual": DADOS_CADASTRO["senha"], "nova_senha": "nova-senha-123"}, headers=auth
    )
    assert certa.status_code == 200


def test_preferencias(client, auth):
    assert client.get(f"{API}/me/preferencias", headers=auth).json() == {
        "lembrete_tarefas": True,
        "som_pomodoro": True,
        "resumo_semanal": False,
    }
    novas = {"lembrete_tarefas": False, "som_pomodoro": True, "resumo_semanal": True}
    assert client.put(f"{API}/me/preferencias", json=novas, headers=auth).json() == novas


def test_excluir_conta_pede_senha_e_apaga_tudo(client, auth):
    client.post(f"{API}/tarefas", json={"titulo": "Estudar"}, headers=auth)

    assert client.request("DELETE", f"{API}/me", json={"senha": "errada"}, headers=auth).status_code == 400
    assert (
        client.request("DELETE", f"{API}/me", json={"senha": DADOS_CADASTRO["senha"]}, headers=auth).status_code == 204
    )
    assert client.get(f"{API}/me", headers=auth).status_code == 401

    # o e-mail fica livre de novo
    cadastrar(client)


def test_exportar_dados(client, auth):
    client.put(f"{API}/me/consentimentos", json={"humor": True}, headers=auth)
    client.post(f"{API}/humor", json={"humor": "bom", "observacao": "Dia produtivo"}, headers=auth)
    client.post(f"{API}/tarefas", json={"titulo": "Estudar Redes"}, headers=auth)

    dados = client.get(f"{API}/me/exportar", headers=auth).json()
    assert dados["usuario"]["email"] == DADOS_CADASTRO["email"]
    assert dados["tarefas"][0]["titulo"] == "Estudar Redes"
    assert dados["registros_humor"][0]["observacao"] == "Dia produtivo"
    assert "senha_hash" not in str(dados)


def test_rate_limit_no_login(client, relogio):
    cadastrar(client)
    limiter.enabled = True
    limiter.reset()
    try:
        login = {"email": DADOS_CADASTRO["email"], "senha": "errada"}
        codigos = [client.post(f"{API}/auth/login", json=login).status_code for _ in range(6)]
        assert codigos[:5] == [401] * 5
        assert codigos[5] == 429
    finally:
        limiter.enabled = False
