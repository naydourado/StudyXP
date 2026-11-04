import { useCallback, useEffect, useState } from "react";
import { LuPlus, LuCircle, LuCircleCheck, LuX } from "react-icons/lu";

import api, { mensagemDeErro } from "../../services/api";
import Layout from "../../components/Layout/Layout";
import NivelCard from "../../components/NivelCard/NivelCard";
import XpToast from "../../components/XpToast/XpToast";
import {
  PRIORIDADES,
  XP_POR_PRIORIDADE,
  nomePrioridade,
  prazoAtrasado,
  textoPrazo,
} from "../../constants/gamificacao";
import "./Tarefas.css";

const FORM_VAZIO = { titulo: "", descricao: "", prioridade: "media", data_prazo: "" };

function ItemTarefa({ tarefa, aoAlternar, aoEditar }) {
  const concluida = tarefa.status === "concluida";
  const atrasada = !concluida && prazoAtrasado(tarefa.data_prazo);

  return (
    <div className={concluida ? "task-item task-done" : "task-item"} onClick={() => aoEditar(tarefa)}>
      <button
        className="task-check"
        aria-label={concluida ? "Reabrir tarefa" : "Concluir tarefa"}
        onClick={(e) => {
          e.stopPropagation();
          aoAlternar(tarefa);
        }}
      >
        {concluida ? <LuCircleCheck className="task-complete-icon" /> : <LuCircle />}
      </button>

      <div className="task-text">
        <strong>{tarefa.titulo}</strong>
        <span className={atrasada ? "prazo-atrasado" : undefined}>
          {textoPrazo(tarefa.data_prazo)} · {nomePrioridade(tarefa.prioridade)}
        </span>
      </div>

      <span className="xp-badge">+{concluida ? tarefa.xp_concedido : tarefa.xp_recompensa}xp</span>
    </div>
  );
}

function Tarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [gamificacao, setGamificacao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [resultadoXp, setResultadoXp] = useState(null);

  // incrementar a versao recarrega os dados
  const [versao, setVersao] = useState(0);
  const carregarDados = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    let ativo = true;
    Promise.all([api.get("/tarefas", { params: { size: 100 } }), api.get("/gamificacao/status")])
      .then(([respostaTarefas, respostaStatus]) => {
        if (!ativo) return;
        setTarefas(respostaTarefas.data);
        setGamificacao(respostaStatus.data);
        setErroLista("");
      })
      .catch((error) => ativo && setErroLista(mensagemDeErro(error, "Não foi possível carregar as tarefas.")))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [versao]);

  const fecharToast = useCallback(() => setResultadoXp(null), []);

  function abrirNova() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(tarefa) {
    setEditandoId(tarefa.id);
    setForm({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao || "",
      prioridade: tarefa.prioridade,
      data_prazo: tarefa.data_prazo || "",
    });
    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErro("");
  }

  function alterarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvarTarefa(e) {
    e.preventDefault();

    if (!form.titulo.trim()) {
      setErro("Informe o título da tarefa.");
      return;
    }

    const dados = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      prioridade: form.prioridade,
      data_prazo: form.data_prazo || null,
    };

    setSalvando(true);
    try {
      if (editandoId) {
        await api.patch(`/tarefas/${editandoId}`, dados);
      } else {
        await api.post("/tarefas", dados);
      }
      fecharModal();
      carregarDados();
    } catch (error) {
      setErro(mensagemDeErro(error, "Erro ao salvar tarefa."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluirTarefa() {
    if (!window.confirm("Excluir esta tarefa?")) return;
    try {
      await api.delete(`/tarefas/${editandoId}`);
      fecharModal();
      carregarDados();
    } catch (error) {
      setErro(mensagemDeErro(error, "Erro ao excluir tarefa."));
    }
  }

  async function alternarStatus(tarefa) {
    const acao = tarefa.status === "concluida" ? "reabrir" : "concluir";
    try {
      const resposta = await api.post(`/tarefas/${tarefa.id}/${acao}`);
      setResultadoXp(resposta.data);
      setGamificacao(resposta.data.gamificacao);
      carregarDados();
    } catch (error) {
      setErroLista(mensagemDeErro(error));
    }
  }

  const pendentes = tarefas.filter((tarefa) => tarefa.status !== "concluida");
  const concluidas = tarefas.filter((tarefa) => tarefa.status === "concluida");

  return (
    <Layout>
      <section className="tarefas-page">
        <header className="tarefas-top">
          <div>
            <h1>Tarefas</h1>
            <p>Organize seus estudos e ganhe XP.</p>
          </div>

          <div className="tasks-right">
            <NivelCard gamificacao={gamificacao} />

            <button className="new-task-btn" onClick={abrirNova}>
              <LuPlus />
              Nova Tarefa
            </button>
          </div>
        </header>

        {erroLista && (
          <p className="error-message" role="alert">
            {erroLista}
          </p>
        )}

        <section className="tarefas-columns">
          <div className="tarefas-card">
            <h2>Pendentes ({pendentes.length})</h2>

            {pendentes.map((tarefa) => (
              <ItemTarefa key={tarefa.id} tarefa={tarefa} aoAlternar={alternarStatus} aoEditar={abrirEdicao} />
            ))}
            {!carregando && pendentes.length === 0 && <p className="empty-text">Nenhuma tarefa pendente.</p>}
          </div>

          <div className="tarefas-card">
            <h2>Concluídas ({concluidas.length})</h2>

            {concluidas.map((tarefa) => (
              <ItemTarefa key={tarefa.id} tarefa={tarefa} aoAlternar={alternarStatus} aoEditar={abrirEdicao} />
            ))}
            {!carregando && concluidas.length === 0 && <p className="empty-text">Nenhuma tarefa concluída.</p>}
          </div>
        </section>

        {modalAberto && (
          <div className="modal-overlay">
            <div className="task-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-tarefa">
              <div className="modal-header">
                <h2 id="titulo-modal-tarefa">{editandoId ? "Editar Tarefa" : "Nova Tarefa"}</h2>

                <button onClick={fecharModal} aria-label="Fechar">
                  <LuX />
                </button>
              </div>

              <form onSubmit={salvarTarefa}>
                <label htmlFor="tarefa-titulo">Título</label>
                <input
                  id="tarefa-titulo"
                  type="text"
                  placeholder="Ex: Estudar React"
                  maxLength={150}
                  value={form.titulo}
                  onChange={(e) => alterarCampo("titulo", e.target.value)}
                />

                <label htmlFor="tarefa-descricao">Descrição</label>
                <textarea
                  id="tarefa-descricao"
                  placeholder="Descreva a tarefa"
                  maxLength={1000}
                  value={form.descricao}
                  onChange={(e) => alterarCampo("descricao", e.target.value)}
                />

                <label htmlFor="tarefa-prazo">Prazo</label>
                <input
                  id="tarefa-prazo"
                  type="date"
                  value={form.data_prazo}
                  onChange={(e) => alterarCampo("data_prazo", e.target.value)}
                />

                <label>Prioridade</label>
                <div className="priority-options">
                  {PRIORIDADES.map((opcao) => (
                    <button
                      key={opcao.valor}
                      type="button"
                      aria-pressed={form.prioridade === opcao.valor}
                      className={form.prioridade === opcao.valor ? "priority-btn active" : "priority-btn"}
                      onClick={() => alterarCampo("prioridade", opcao.valor)}
                    >
                      <span>{opcao.nome}</span>
                      <small>{XP_POR_PRIORIDADE[opcao.valor]} XP</small>
                    </button>
                  ))}
                </div>

                {erro && (
                  <span className="error-message" role="alert">
                    {erro}
                  </span>
                )}

                <div className="modal-actions">
                  {editandoId && (
                    <button type="button" className="danger-btn" onClick={excluirTarefa}>
                      Excluir
                    </button>
                  )}

                  <button type="button" className="cancel-btn" onClick={fecharModal}>
                    Cancelar
                  </button>

                  <button type="submit" className="save-btn" disabled={salvando}>
                    {editandoId ? "Salvar alterações" : "Criar tarefa"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      <XpToast resultado={resultadoXp} aoFechar={fecharToast} />
    </Layout>
  );
}

export default Tarefas;
