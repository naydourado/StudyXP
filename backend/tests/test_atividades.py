from tests.conftest import cadastrar

API = "/api/v1"


def _criar_tarefa(client, auth, **dados):
    resposta = client.post(f"{API}/tarefas", json={"titulo": "Estudar", **dados}, headers=auth)
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


# ---------- tarefas ----------


def test_xp_da_tarefa_vem_da_prioridade_e_nao_do_cliente(client, auth):
    tarefa = _criar_tarefa(client, auth, prioridade="alta", xp_recompensa=9999, status="concluida")
    assert tarefa["xp_recompensa"] == 80
    assert tarefa["status"] == "pendente"


def test_concluir_da_xp_uma_vez_e_reabrir_estorna(client, auth):
    tarefa = _criar_tarefa(client, auth, prioridade="media")

    concluida = client.post(f"{API}/tarefas/{tarefa['id']}/concluir", headers=auth).json()
    assert concluida["xp_ganho"] == 50
    assert concluida["gamificacao"]["xp_total"] == 50
    assert concluida["gamificacao"]["ofensiva_atual"] == 1

    assert client.post(f"{API}/tarefas/{tarefa['id']}/concluir", headers=auth).status_code == 409

    reaberta = client.post(f"{API}/tarefas/{tarefa['id']}/reabrir", headers=auth).json()
    assert reaberta["xp_ganho"] == -50
    assert reaberta["gamificacao"]["xp_total"] == 0


def test_limite_diario_de_tarefas_pontuando(client, auth, relogio):
    ganhos = []
    for _ in range(16):
        tarefa = _criar_tarefa(client, auth, prioridade="baixa")
        ganhos.append(client.post(f"{API}/tarefas/{tarefa['id']}/concluir", headers=auth).json()["xp_ganho"])
    assert ganhos[:15] == [20] * 15
    assert ganhos[15] == 0

    # no dia seguinte volta a pontuar
    relogio.avancar(days=1)
    tarefa = _criar_tarefa(client, auth, prioridade="baixa")
    assert client.post(f"{API}/tarefas/{tarefa['id']}/concluir", headers=auth).json()["xp_ganho"] == 20


def test_nao_acessa_tarefa_de_outro_usuario(client, auth):
    tarefa = _criar_tarefa(client, auth)
    outro = cadastrar(client, email="outra@email.com")

    assert client.get(f"{API}/tarefas/{tarefa['id']}", headers=outro).status_code == 404
    assert client.patch(f"{API}/tarefas/{tarefa['id']}", json={"titulo": "x"}, headers=outro).status_code == 404
    assert client.post(f"{API}/tarefas/{tarefa['id']}/concluir", headers=outro).status_code == 404
    assert client.delete(f"{API}/tarefas/{tarefa['id']}", headers=outro).status_code == 404
    assert client.get(f"{API}/tarefas", headers=outro).json() == []


def test_listar_filtra_e_ordena(client, auth):
    _criar_tarefa(client, auth, titulo="Sem prazo")
    _criar_tarefa(client, auth, titulo="Atrasada", data_prazo="2026-10-18")
    _criar_tarefa(client, auth, titulo="Hoje", data_prazo="2026-10-20")
    feita = _criar_tarefa(client, auth, titulo="Feita")
    client.post(f"{API}/tarefas/{feita['id']}/concluir", headers=auth)

    titulos = [t["titulo"] for t in client.get(f"{API}/tarefas", headers=auth).json()]
    assert titulos == ["Atrasada", "Hoje", "Sem prazo", "Feita"]

    atrasadas = client.get(f"{API}/tarefas", params={"prazo": "atrasadas"}, headers=auth).json()
    assert [t["titulo"] for t in atrasadas] == ["Atrasada"]

    concluidas = client.get(f"{API}/tarefas", params={"status": "concluida"}, headers=auth).json()
    assert [t["titulo"] for t in concluidas] == ["Feita"]


def test_editar_prioridade_recalcula_xp(client, auth):
    tarefa = _criar_tarefa(client, auth, prioridade="baixa")
    editada = client.patch(
        f"{API}/tarefas/{tarefa['id']}", json={"prioridade": "alta", "data_prazo": None}, headers=auth
    )
    assert editada.json()["xp_recompensa"] == 80


def test_prioridade_invalida(client, auth):
    resposta = client.post(f"{API}/tarefas", json={"titulo": "x", "prioridade": "urgente"}, headers=auth)
    assert resposta.status_code == 422


# ---------- foco ----------


def test_sessao_completa_da_xp_por_minuto_e_conta_ofensiva(client, auth, relogio):
    sessao = client.post(f"{API}/foco/sessoes", json={"duracao_planejada": 25}, headers=auth).json()
    relogio.avancar(minutes=25)

    resultado = client.post(f"{API}/foco/sessoes/{sessao['id']}/finalizar", headers=auth).json()
    assert resultado["sessao"]["status"] == "concluida"
    assert resultado["xp_ganho"] == 25
    assert resultado["gamificacao"]["ofensiva_atual"] == 1

    resumo = client.get(f"{API}/foco/resumo-hoje", headers=auth).json()
    assert resumo == {"minutos_foco": 25, "sessoes_concluidas": 1}


def test_finalizar_antes_do_tempo_conta_so_minutos_reais(client, auth, relogio):
    sessao = client.post(f"{API}/foco/sessoes", json={"duracao_planejada": 25}, headers=auth).json()
    relogio.avancar(minutes=10, seconds=40)

    resultado = client.post(f"{API}/foco/sessoes/{sessao['id']}/finalizar", headers=auth).json()
    assert resultado["sessao"]["status"] == "interrompida"
    assert resultado["xp_ganho"] == 10
    assert resultado["gamificacao"]["ofensiva_atual"] == 0


def test_pausa_nao_da_xp_e_limite_diario_de_foco(client, auth, relogio):
    pausa = client.post(
        f"{API}/foco/sessoes", json={"tipo": "pausa_curta", "duracao_planejada": 5}, headers=auth
    ).json()
    relogio.avancar(minutes=5)
    assert client.post(f"{API}/foco/sessoes/{pausa['id']}/finalizar", headers=auth).json()["xp_ganho"] == 0

    ganhos = []
    for _ in range(3):
        sessao = client.post(f"{API}/foco/sessoes", json={"duracao_planejada": 100}, headers=auth).json()
        relogio.avancar(minutes=100)
        ganhos.append(client.post(f"{API}/foco/sessoes/{sessao['id']}/finalizar", headers=auth).json()["xp_ganho"])
    assert ganhos == [100, 100, 40]


def test_iniciar_nova_sessao_cancela_a_anterior(client, auth):
    primeira = client.post(f"{API}/foco/sessoes", json={"duracao_planejada": 25}, headers=auth).json()
    client.post(f"{API}/foco/sessoes", json={"duracao_planejada": 25}, headers=auth)
    assert (
        client.post(f"{API}/foco/sessoes/{primeira['id']}/finalizar", headers=auth).json()["code"] == "sessao_encerrada"
    )


# ---------- humor ----------


def test_humor_exige_consentimento(client, auth):
    resposta = client.post(f"{API}/humor", json={"humor": "bom"}, headers=auth)
    assert resposta.status_code == 403
    assert resposta.json()["code"] == "consentimento_necessario"


def test_humor_registra_criptografado_e_da_xp_uma_vez_por_dia(client, auth):
    client.put(f"{API}/me/consentimentos", json={"humor": True}, headers=auth)

    primeiro = client.post(f"{API}/humor", json={"humor": "otimo", "observacao": "Dia ótimo"}, headers=auth).json()
    assert primeiro["xp_ganho"] == 5
    assert [c["codigo"] for c in primeiro["novas_conquistas"]] == ["primeiro_humor"]
    assert client.post(f"{API}/humor", json={"humor": "cansado"}, headers=auth).json()["xp_ganho"] == 0

    from sqlalchemy import select

    from app.core.database import SessionLocal
    from app.models import RegistroHumor

    with SessionLocal() as db:
        cifrada = db.scalar(
            select(RegistroHumor.observacao_cifrada).where(RegistroHumor.id == primeiro["registro"]["id"])
        )
    assert cifrada and "ótimo" not in cifrada

    historico = client.get(f"{API}/humor", headers=auth).json()
    assert [h["humor"] for h in historico] == ["cansado", "otimo"]
    assert historico[1]["observacao"] == "Dia ótimo"


def test_revogar_consentimento_apaga_registros(client, auth):
    client.put(f"{API}/me/consentimentos", json={"humor": True}, headers=auth)
    client.post(f"{API}/humor", json={"humor": "bom"}, headers=auth)

    resposta = client.put(f"{API}/me/consentimentos", json={"humor": False}, headers=auth).json()
    assert resposta["humor"] is False

    client.put(f"{API}/me/consentimentos", json={"humor": True}, headers=auth)
    assert client.get(f"{API}/humor", headers=auth).json() == []


def test_humor_invalido(client, auth):
    client.put(f"{API}/me/consentimentos", json={"humor": True}, headers=auth)
    assert client.post(f"{API}/humor", json={"humor": "furioso"}, headers=auth).status_code == 422
