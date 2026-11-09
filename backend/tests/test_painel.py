API = "/api/v1"


def _concluir_tarefa(client, auth, prioridade="alta"):
    tarefa = client.post(f"{API}/tarefas", json={"titulo": "t", "prioridade": prioridade}, headers=auth).json()
    return client.post(f"{API}/tarefas/{tarefa['id']}/concluir", headers=auth).json()


def test_conquistas_desbloqueiam_e_aparecem_na_lista(client, auth):
    # 80 xp: ainda nivel 1
    _concluir_tarefa(client, auth)
    resultado = _concluir_tarefa(client, auth)
    assert [c["codigo"] for c in resultado["novas_conquistas"]] == ["primeiro_nivel"]

    conquistas = {c["codigo"]: c["desbloqueada"] for c in client.get(f"{API}/conquistas", headers=auth).json()}
    assert conquistas["primeiro_nivel"] is True
    assert conquistas["tarefas_10"] is False
    assert len(conquistas) == 8


def test_progresso_semana_agrupa_por_dia_local(client, auth, relogio):
    _concluir_tarefa(client, auth, "media")
    relogio.avancar(days=1)
    _concluir_tarefa(client, auth, "alta")
    sessao = client.post(f"{API}/foco/sessoes", json={"duracao_planejada": 25}, headers=auth).json()
    relogio.avancar(minutes=25)
    client.post(f"{API}/foco/sessoes/{sessao['id']}/finalizar", headers=auth)

    dados = client.get(f"{API}/progresso", headers=auth).json()
    assert dados["totais"] == {"xp_total": 155, "minutos_foco": 25, "tarefas_concluidas": 2}
    assert len(dados["serie"]) == 7

    ontem, hoje = dados["serie"][-2], dados["serie"][-1]
    assert (ontem["data"], ontem["xp"], ontem["tarefas_concluidas"]) == ("2026-10-20", 50, 1)
    assert (hoje["data"], hoje["dia_semana"], hoje["xp"], hoje["minutos_foco"]) == ("2026-10-21", "qua", 105, 25)


def test_dashboard(client, auth):
    client.post(f"{API}/tarefas", json={"titulo": "Pendente"}, headers=auth)
    _concluir_tarefa(client, auth)

    dados = client.get(f"{API}/dashboard", headers=auth).json()
    assert dados["usuario"]["nome"] == "Nayra"
    assert [t["status"] for t in dados["tarefas"]] == ["pendente", "concluida"]
    assert dados["gamificacao"]["xp_total"] == 80
    # 20/10/2026 e uma terca (indice 2, semana comeca no domingo)
    assert [d["ativo"] for d in dados["semana"]] == [False, False, True, False, False, False, False]
    assert dados["humor_autorizado"] is False
    assert dados["ultimo_humor"] is None


def test_health(client):
    assert client.get(f"{API}/health").json() == {"status": "ok"}


def test_cabecalhos_de_seguranca(client):
    resposta = client.get(f"{API}/health")
    assert resposta.headers["x-content-type-options"] == "nosniff"
    assert resposta.headers["x-frame-options"] == "DENY"
