from datetime import datetime

import pytest

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models import HistoricoAcesso
from app.services import email, push
from tests.conftest import DADOS_CADASTRO, cadastrar

API = "/api/v1"
TOKEN_EXPO = "ExponentPushToken[abc123]"


@pytest.fixture(autouse=True)
def limpar_saidas():
    email.caixa_de_saida.clear()
    push.enviadas.clear()
    yield


def _token_do_email() -> str:
    assert len(email.caixa_de_saida) == 1
    texto = email.caixa_de_saida[-1].texto
    return texto.split("token=")[1].split()[0]


def _login(client, senha):
    return client.post(f"{API}/auth/login", json={"email": DADOS_CADASTRO["email"], "senha": senha})


# ---------- esqueci minha senha ----------


def test_esqueci_senha_nao_revela_se_email_existe(client, relogio):
    cadastrar(client)
    existe = client.post(f"{API}/auth/esqueci-senha", json={"email": DADOS_CADASTRO["email"]})
    nao_existe = client.post(f"{API}/auth/esqueci-senha", json={"email": "ninguem@email.com"})

    assert existe.status_code == nao_existe.status_code == 202
    assert existe.json() == nao_existe.json()
    assert len(email.caixa_de_saida) == 1
    assert email.caixa_de_saida[0].para == DADOS_CADASTRO["email"]


def test_redefinir_senha_troca_a_senha_e_derruba_sessoes(client, relogio):
    refresh = cadastrar(client)["_refresh"]
    client.post(f"{API}/auth/esqueci-senha", json={"email": DADOS_CADASTRO["email"]})
    token = _token_do_email()

    resposta = client.post(f"{API}/auth/redefinir-senha", json={"token": token, "nova_senha": "senha-nova-456"})
    assert resposta.status_code == 200

    assert _login(client, DADOS_CADASTRO["senha"]).status_code == 401
    assert _login(client, "senha-nova-456").status_code == 200
    # a sessao aberta antes da troca nao vale mais
    renovar = client.post(f"{API}/auth/refresh", json={"refresh_token": refresh}, headers={"X-Cliente": "mobile"})
    assert renovar.status_code == 401

    # o link e de uso unico
    de_novo = client.post(f"{API}/auth/redefinir-senha", json={"token": token, "nova_senha": "outra-senha-789"})
    assert de_novo.json()["code"] == "token_redefinicao_invalido"


def test_link_de_redefinicao_expira_em_30_minutos(client, relogio):
    cadastrar(client)
    client.post(f"{API}/auth/esqueci-senha", json={"email": DADOS_CADASTRO["email"]})
    token = _token_do_email()

    relogio.avancar(minutes=31)
    resposta = client.post(f"{API}/auth/redefinir-senha", json={"token": token, "nova_senha": "senha-nova-456"})
    assert resposta.status_code == 400


def test_novo_pedido_invalida_o_link_anterior(client, relogio):
    cadastrar(client)
    client.post(f"{API}/auth/esqueci-senha", json={"email": DADOS_CADASTRO["email"]})
    primeiro = _token_do_email()
    email.caixa_de_saida.clear()
    client.post(f"{API}/auth/esqueci-senha", json={"email": DADOS_CADASTRO["email"]})
    segundo = _token_do_email()

    assert (
        client.post(f"{API}/auth/redefinir-senha", json={"token": primeiro, "nova_senha": "x" * 10}).status_code == 400
    )
    assert (
        client.post(f"{API}/auth/redefinir-senha", json={"token": segundo, "nova_senha": "x" * 10}).status_code == 200
    )


def test_email_de_redefinicao_escapa_html_do_nome(client, relogio):
    cadastrar(client, nome="<b>Hacker</b>")
    client.post(f"{API}/auth/esqueci-senha", json={"email": DADOS_CADASTRO["email"]})
    assert "<b>Hacker</b>" not in email.caixa_de_saida[0].html
    assert "&lt;b&gt;Hacker&lt;/b&gt;" in email.caixa_de_saida[0].html


# ---------- dispositivos push ----------


def test_registrar_e_remover_dispositivo(client, auth):
    assert (
        client.post(
            f"{API}/me/dispositivos", json={"token": "qualquer", "plataforma": "android"}, headers=auth
        ).status_code
        == 422
    )

    dados = {"token": TOKEN_EXPO, "plataforma": "android"}
    assert client.post(f"{API}/me/dispositivos", json=dados, headers=auth).status_code == 204
    # repetir nao duplica
    assert client.post(f"{API}/me/dispositivos", json=dados, headers=auth).status_code == 204
    assert (
        client.request("DELETE", f"{API}/me/dispositivos", json={"token": TOKEN_EXPO}, headers=auth).status_code == 204
    )


def test_dispositivo_passa_para_a_conta_que_entrou_no_aparelho(client, relogio):
    primeira = cadastrar(client)
    segunda = cadastrar(client, email="outra@email.com")
    dados = {"token": TOKEN_EXPO, "plataforma": "ios"}
    client.post(f"{API}/me/dispositivos", json=dados, headers=primeira)
    client.post(f"{API}/me/dispositivos", json=dados, headers=segunda)

    with SessionLocal() as db:
        from sqlalchemy import select

        from app.models import DispositivoPush

        donos = db.scalars(select(DispositivoPush.usuario_id)).all()
    assert donos == [2]


# ---------- lembretes de prazo ----------


def _preparar_lembrete(client, auth, prazo="2026-10-21"):
    client.post(f"{API}/me/dispositivos", json={"token": TOKEN_EXPO, "plataforma": "android"}, headers=auth)
    return client.post(f"{API}/tarefas", json={"titulo": "Prova de Redes", "data_prazo": prazo}, headers=auth).json()


def _rodar(job):
    from app.services import jobs

    with SessionLocal() as db:
        return jobs.JOBS[job](db)


def test_lembrete_na_vespera_so_a_partir_das_18h_e_sem_repetir(client, auth, relogio):
    _preparar_lembrete(client, auth)  # prazo amanha (21/10)

    assert _rodar("lembretes")["notificacoes"] == 0  # 12h em sao paulo

    relogio.atual = datetime(2026, 10, 20, 21, 30)  # 18h30 em sao paulo
    assert _rodar("lembretes") == {"tarefas_avisadas": 1, "notificacoes": 1}
    assert push.enviadas[0].titulo == "Tarefas para amanhã"
    assert push.enviadas[0].corpo == "Prova de Redes"

    assert _rodar("lembretes")["notificacoes"] == 0  # nao repete

    relogio.atual = datetime(2026, 10, 21, 11, 5)  # 8h05 do dia do prazo
    assert _rodar("lembretes")["notificacoes"] == 1
    assert push.enviadas[-1].titulo == "Tarefas para hoje"


def test_lembrete_respeita_preferencia_e_tarefa_concluida(client, auth, relogio):
    tarefa = _preparar_lembrete(client, auth, prazo="2026-10-20")
    client.put(
        f"{API}/me/preferencias",
        json={"lembrete_tarefas": False, "som_pomodoro": True, "resumo_semanal": False},
        headers=auth,
    )
    assert _rodar("lembretes")["notificacoes"] == 0

    client.put(
        f"{API}/me/preferencias",
        json={"lembrete_tarefas": True, "som_pomodoro": True, "resumo_semanal": False},
        headers=auth,
    )
    client.post(f"{API}/tarefas/{tarefa['id']}/concluir", headers=auth)
    assert _rodar("lembretes")["notificacoes"] == 0


def test_mudar_prazo_reativa_o_lembrete(client, auth, relogio):
    tarefa = _preparar_lembrete(client, auth, prazo="2026-10-20")
    assert _rodar("lembretes")["notificacoes"] == 1

    client.patch(f"{API}/tarefas/{tarefa['id']}", json={"data_prazo": "2026-10-22"}, headers=auth)
    relogio.atual = datetime(2026, 10, 22, 12, 0)
    assert _rodar("lembretes")["notificacoes"] == 1


def test_varias_tarefas_viram_uma_notificacao(client, auth, relogio):
    _preparar_lembrete(client, auth, prazo="2026-10-20")
    client.post(f"{API}/tarefas", json={"titulo": "Trabalho de BD", "data_prazo": "2026-10-20"}, headers=auth)
    assert _rodar("lembretes") == {"tarefas_avisadas": 2, "notificacoes": 1}
    assert push.enviadas[0].corpo == "Prova de Redes e mais 1"


# ---------- resumo semanal ----------


def test_resumo_semanal_so_domingo_a_noite_e_uma_vez(client, auth, relogio):
    client.put(
        f"{API}/me/preferencias",
        json={"lembrete_tarefas": True, "som_pomodoro": True, "resumo_semanal": True},
        headers=auth,
    )
    tarefa = client.post(f"{API}/tarefas", json={"titulo": "t", "prioridade": "alta"}, headers=auth).json()
    client.post(f"{API}/tarefas/{tarefa['id']}/concluir", headers=auth)

    assert _rodar("resumo-semanal")["resumos_enviados"] == 0  # terca

    relogio.atual = datetime(2026, 10, 25, 22, 0)  # domingo 19h em sao paulo
    assert _rodar("resumo-semanal")["resumos_enviados"] == 1
    assert "80 XP" in email.caixa_de_saida[0].texto
    assert _rodar("resumo-semanal")["resumos_enviados"] == 0


def test_resumo_semanal_e_opt_in(client, auth, relogio):
    relogio.atual = datetime(2026, 10, 25, 22, 0)
    assert _rodar("resumo-semanal")["resumos_enviados"] == 0


# ---------- limpeza (retencao lgpd) ----------


def test_limpeza_apaga_acessos_com_mais_de_6_meses(client, relogio):
    cadastrar(client)
    client.post(f"{API}/auth/login", json={"email": DADOS_CADASTRO["email"], "senha": DADOS_CADASTRO["senha"]})

    assert _rodar("limpeza")["acessos_apagados"] == 0
    relogio.avancar(days=181)
    resultado = _rodar("limpeza")
    assert resultado["acessos_apagados"] == 1
    assert resultado["refresh_tokens_apagados"] == 2

    with SessionLocal() as db:
        assert db.query(HistoricoAcesso).count() == 0


def test_limpeza_cancela_sessao_de_foco_esquecida(client, auth, relogio):
    client.post(f"{API}/foco/sessoes", json={"duracao_planejada": 25}, headers=auth)
    relogio.avancar(days=2)
    assert _rodar("limpeza")["sessoes_canceladas"] == 1


# ---------- rota dos jobs ----------


def test_rota_de_jobs_exige_token(client, monkeypatch):
    assert client.post(f"{API}/interno/jobs/limpeza").status_code == 404  # sem CRON_TOKEN configurado

    monkeypatch.setattr(get_settings(), "cron_token", "segredo-do-cron")
    assert client.post(f"{API}/interno/jobs/limpeza", headers={"X-Cron-Token": "errado"}).status_code == 404
    assert (
        client.post(f"{API}/interno/jobs/inexistente", headers={"X-Cron-Token": "segredo-do-cron"}).status_code == 404
    )

    resposta = client.post(f"{API}/interno/jobs/limpeza", headers={"X-Cron-Token": "segredo-do-cron"})
    assert resposta.status_code == 200
    assert resposta.json()["job"] == "limpeza"
