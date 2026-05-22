import { useEffect, useState } from "react";
import {
    LuPlus,
    LuCircle,
    LuCircleCheck,
    LuX,
} from "react-icons/lu";

import api from "../../services/api";
import Layout from "../../components/Layout/Layout";
import "./Tarefas.css";

function Tarefas() {
    const [tarefas, setTarefas] = useState([]);
    const [dashboard, setDashboard] = useState(null);

    const [modalAberto, setModalAberto] = useState(false);
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [prioridade, setPrioridade] = useState("media");
    const [editandoId, setEditandoId] = useState(null);
    const [erro, setErro] = useState("");

    const xpPorPrioridade = {
        baixa: 20,
        media: 50,
        alta: 80,
    };

    async function carregarDados() {
        try {
            const tarefasResponse = await api.get("/tarefas");
            const dashboardResponse = await api.get("/dashboard");

            setTarefas(tarefasResponse.data);
            setDashboard(dashboardResponse.data);
        } catch (error) {
            console.log(error.response?.data || error);
        }
    }

    useEffect(() => {
        carregarDados();
    }, []);

    function abrirModal() {
        setErro("");
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setTitulo("");
        setDescricao("");
        setPrioridade("media");
        setErro("");
        setEditandoId(null);
    }

    function abrirEdicao(tarefa) {
        setEditandoId(tarefa.id);
        setTitulo(tarefa.titulo);
        setDescricao(tarefa.descricao || "");
        setPrioridade(tarefa.prioridade);
        setErro("");
        setModalAberto(true);
    }

    async function salvarTarefa(e) {
        e.preventDefault();

        if (!titulo.trim()) {
            setErro("Informe o título da tarefa.");
            return;
        }

        try {
            const dados = {
                titulo,
                descricao,
                prioridade,
                xp_recompensa: xpPorPrioridade[prioridade],
            };

            if (editandoId) {
                await api.put(`/tarefas/${editandoId}`, dados);
            } else {
                await api.post("/tarefas", dados);
            }

            fecharModal();
            carregarDados();
        } catch (error) {
            console.log(error.response?.data || error);
            setErro("Erro ao salvar tarefa.");
        }
    }

    async function alterarStatusTarefa(tarefa) {
        try {
            const novoStatus =
                tarefa.status === "concluida"
                    ? "pendente"
                    : "concluida";

            await api.put(`/tarefas/${tarefa.id}`, {
                status: novoStatus,
            });

            carregarDados();
        } catch (error) {
            console.log(error.response?.data || error);
        }
    }

    const pendentes = tarefas.filter(
        (tarefa) => tarefa.status !== "concluida"
    );

    const concluidas = tarefas.filter(
        (tarefa) => tarefa.status === "concluida"
    );

    const xpAtual = dashboard?.xp || 0;
    const nivel = dashboard?.nivel || 1;
    const xpProximoNivel = nivel * 100;
    const progressoXp = Math.min(
        (xpAtual / xpProximoNivel) * 100,
        100
    );

    return (
        <Layout>
            <section className="tarefas-page">
                <header className="tarefas-top">
                    <div>
                        <h1>Tarefas</h1>
                        <p>Organize seus estudos e ganhe XP.</p>
                    </div>

                    <div className="tasks-right">
                        <div className="level-card">
                            <div className="level-info">
                                <strong>Nível {nivel}</strong>

                                <span>
                                    {xpAtual} / {xpProximoNivel} XP
                                </span>
                            </div>

                            <div className="level-bar">
                                <div
                                    className="level-progress"
                                    style={{
                                        width: `${progressoXp}%`,
                                    }}
                                ></div>
                            </div>
                        </div>

                        <button
                            className="new-task-btn"
                            onClick={abrirModal}
                        >
                            <LuPlus />
                            Nova Tarefa
                        </button>
                    </div>
                </header>

                <section className="tarefas-columns">
                    <div className="tarefas-card">
                        <h2>
                            Pendentes ({pendentes.length})
                        </h2>

                        {pendentes.length > 0 ? (
                            pendentes.map((tarefa) => (
                                <div
                                    className="task-item"
                                    key={tarefa.id}
                                    onClick={() =>
                                        abrirEdicao(tarefa)
                                    }
                                >
                                    <button
                                        className="task-check"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            alterarStatusTarefa(
                                                tarefa
                                            );
                                        }}
                                    >
                                        <LuCircle />
                                    </button>

                                    <div className="task-text">
                                        <strong>
                                            {tarefa.titulo}
                                        </strong>

                                        <span>
                                            {tarefa.prioridade.charAt(0).toUpperCase() +
                                                tarefa.prioridade.slice(1)}
                                        </span>
                                    </div>

                                    <span className="xp-badge">
                                        +{tarefa.xp_recompensa}
                                        xp
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="empty-text">
                                Nenhuma tarefa pendente.
                            </p>
                        )}
                    </div>

                    <div className="tarefas-card">
                        <h2>
                            Concluídas ({concluidas.length})
                        </h2>

                        {concluidas.length > 0 ? (
                            concluidas.map((tarefa) => (
                                <div
                                    className="task-item task-done"
                                    key={tarefa.id}
                                    onClick={() =>
                                        abrirEdicao(tarefa)
                                    }
                                >
                                    <button
                                        className="task-check"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            alterarStatusTarefa(
                                                tarefa
                                            );
                                        }}
                                    >
                                        <LuCircleCheck className="task-complete-icon" />
                                    </button>

                                    <div className="task-text">
                                        <strong>
                                            {tarefa.titulo}
                                        </strong>

                                        <span>
                                            {tarefa.prioridade.charAt(0).toUpperCase() +
                                                tarefa.prioridade.slice(1)}
                                        </span>
                                    </div>

                                    <span className="xp-badge">
                                        +{tarefa.xp_recompensa}
                                        xp
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="empty-text">
                                Nenhuma tarefa concluída.
                            </p>
                        )}
                    </div>
                </section>

                {modalAberto && (
                    <div className="modal-overlay">
                        <div className="task-modal">
                            <div className="modal-header">
                                <h2>
                                    {editandoId
                                        ? "Editar Tarefa"
                                        : "Nova Tarefa"}
                                </h2>

                                <button onClick={fecharModal}>
                                    <LuX />
                                </button>
                            </div>

                            <form onSubmit={salvarTarefa}>
                                <label>Título</label>

                                <input
                                    type="text"
                                    placeholder="Ex: Estudar React"
                                    value={titulo}
                                    onChange={(e) =>
                                        setTitulo(e.target.value)
                                    }
                                />

                                <label>Descrição</label>

                                <textarea
                                    placeholder="Descreva a tarefa"
                                    value={descricao}
                                    onChange={(e) =>
                                        setDescricao(
                                            e.target.value
                                        )
                                    }
                                />

                                <label>Prioridade</label>

                                <div className="priority-options">
                                    <button
                                        type="button"
                                        className={
                                            prioridade === "baixa"
                                                ? "priority-btn active"
                                                : "priority-btn"
                                        }
                                        onClick={() =>
                                            setPrioridade("baixa")
                                        }
                                    >
                                        <span>Baixa</span>
                                        <small>20 XP</small>
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            prioridade === "media"
                                                ? "priority-btn active"
                                                : "priority-btn"
                                        }
                                        onClick={() =>
                                            setPrioridade("media")
                                        }
                                    >
                                        <span>Média</span>
                                        <small>50 XP</small>
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            prioridade === "alta"
                                                ? "priority-btn active"
                                                : "priority-btn"
                                        }
                                        onClick={() =>
                                            setPrioridade("alta")
                                        }
                                    >
                                        <span>Alta</span>
                                        <small>80 XP</small>
                                    </button>
                                </div>

                                {erro && (
                                    <span className="error-message">
                                        {erro}
                                    </span>
                                )}

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={fecharModal}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="save-btn"
                                    >
                                        {editandoId
                                            ? "Salvar alterações"
                                            : "Criar tarefa"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </section>
        </Layout>
    );
}

export default Tarefas;