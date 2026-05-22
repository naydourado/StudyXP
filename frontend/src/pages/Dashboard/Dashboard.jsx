import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    LuCircleCheck,
    LuCircle,
    LuFlame,
    LuTimer,
    LuSmile,
    LuArrowRight,
} from "react-icons/lu";

import api from "../../services/api";
import Layout from "../../components/Layout/Layout";
import "./Dashboard.css";

function Dashboard() {
    const [dados, setDados] = useState(null);

    useEffect(() => {
        async function carregarDashboard() {
            try {
                const response = await api.get("/dashboard");
                setDados(response.data);
            } catch (error) {
                console.log(error.response?.data || error);
            }
        }

        carregarDashboard();
    }, []);

    if (!dados) {
        return (
            <Layout>
                <p>Carregando...</p>
            </Layout>
        );
    }

    const xpAtual = dados.xp || 0;
    const nivel = dados.nivel || 1;
    const xpProximoNivel = nivel * 100;
    const progressoXp = Math.min((xpAtual / xpProximoNivel) * 100, 100);

    return (
        <Layout>
            <section className="dashboard-page">
                <header className="dashboard-top">
                    <div>
                        <h1>Olá, {dados.usuario || "Usuário"}!</h1>
                        <p>Hora de Estudar.</p>
                    </div>

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
                                style={{ width: `${progressoXp}%` }}
                            ></div>
                        </div>
                    </div>
                </header>

                <section className="dashboard-grid">
                    <div className="dash-card tasks-card">
                        <div className="card-title-row">
                            <div className="card-title">
                                <LuCircleCheck />
                                <h2>Tarefas de Hoje</h2>
                            </div>

                            <Link to="/tarefas" className="see-all">
                                Ver tudo <LuArrowRight />
                            </Link>
                        </div>

                        {dados.tarefas && dados.tarefas.length > 0 ? (
                            dados.tarefas.map((tarefa) => (
                                <div
                                    className={
                                        tarefa.status === "concluida"
                                            ? "task-item task-done"
                                            : "task-item"
                                    }
                                    key={tarefa.id}
                                >
                                    {tarefa.status === "concluida" ? (
                                        <span className="task-dot"></span>
                                    ) : (
                                        <LuCircle className="task-icon" />
                                    )}

                                    <div className="task-text">
                                        <strong>{tarefa.titulo}</strong>
                                        <span>{tarefa.prioridade}</span>
                                    </div>

                                    <span className="xp-badge">
                                        +{tarefa.xp_recompensa}xp
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="empty-text">
                                Nenhuma tarefa cadastrada ainda.
                            </p>
                        )}
                    </div>

                    <div className="dash-card sequence-card">
                        <div className="card-title">
                            <LuFlame />
                            <h2>Sua sequência</h2>
                        </div>

                        <div className="sequence-number">
                            <strong>{dados.sequencia_dias || 0}</strong>
                            <span>dias seguidos</span>
                        </div>

                        <div className="week-row">
                            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map(
                                (dia, index) => (
                                    <div className="week-day" key={dia}>
                                        <div
                                            className={
                                                index < (dados.sequencia_dias || 0)
                                                    ? "day active"
                                                    : "day"
                                            }
                                        ></div>
                                        <span>{dia}</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    <div className="dash-card focus-card">
                        <div className="card-title">
                            <LuTimer />
                            <h2>Sessão de Foco</h2>
                        </div>

                        <p>Bora estudar? Inicie um pomodoro de 25 minutos.</p>

                        <Link to="/foco" className="focus-link">
                            Iniciar foco
                        </Link>
                    </div>

                    <div className="dash-card mood-card">
                        <div className="card-title">
                            <LuSmile />
                            <h2>Como você está?</h2>
                        </div>

                        <p>
                            Registrar o humor te ajuda a entender seus padrões de estudo.
                        </p>

                        <Link to="/humor" className="mood-options">
                            <button>🥱</button>
                            <button>🙂</button>
                            <button>😐</button>
                            <button>☹️</button>
                            <button>😊</button>
                        </Link>
                    </div>
                </section>
            </section>
        </Layout>
    );
}

export default Dashboard;