import { useEffect, useState } from "react";
import {
    LuUser,
    LuFlame,
    LuClock,
    LuSquareCheck,
    LuTrophy,
    LuTarget,
    LuLock,
} from "react-icons/lu";

import api from "../../services/api";
import Layout from "../../components/Layout/Layout";
import "./Perfil.css";

function Perfil() {
    const [usuario, setUsuario] = useState(null);
    const [dashboard, setDashboard] = useState(null);

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [mensagem, setMensagem] = useState("");

    useEffect(() => {
        async function carregarDados() {
            try {
                const usuarioResponse = await api.get("/me");
                const dashboardResponse = await api.get("/dashboard");

                setUsuario(usuarioResponse.data);
                setDashboard(dashboardResponse.data);

                setNome(usuarioResponse.data.nome || "");
                setEmail(usuarioResponse.data.email || "");
            } catch (error) {
                console.log(error.response?.data || error);
            }
        }

        carregarDados();
    }, []);

    async function salvarPerfil(e) {
        e.preventDefault();

        try {
            const response = await api.put("/perfil", {
                nome,
                email,
            });

            setUsuario(response.data);
            setMensagem("Alterações salvas com sucesso!");
        } catch (error) {
            console.log(error.response?.data || error);
            setMensagem("Erro ao salvar alterações.");
        }
    }

    if (!usuario || !dashboard) {
        return (
            <Layout>
                <p>Carregando...</p>
            </Layout>
        );
    }

    const xpAtual = dashboard.xp || 0;
    const nivel = dashboard.nivel || 1;
    const xpProximoNivel = nivel * 100;
    const progressoXp = Math.min((xpAtual / xpProximoNivel) * 100, 100);
    const xpRestante = xpProximoNivel - xpAtual;

    const conquistas = [
        {
            titulo: "Primeiro nível",
            descricao: "Conquistado ao iniciar sua jornada",
            icone: <LuTrophy />,
            desbloqueada: nivel >= 1,
            tipo: "blue",
        },
        {
            titulo: "7 dias seguidos",
            descricao: "Mantenha uma sequência de estudos",
            icone: <LuFlame />,
            desbloqueada: dashboard.sequencia_dias >= 7,
            tipo: "orange",
        },
        {
            titulo: "10 tarefas",
            descricao: "Conclua 10 tarefas",
            icone: <LuTarget />,
            desbloqueada: dashboard.tarefas_concluidas >= 10,
            tipo: "blue",
        },
        {
            titulo: "Mestre do Foco",
            descricao: "Alcance 2h de foco",
            icone: <LuLock />,
            desbloqueada: dashboard.tempo_total_foco >= 120,
            tipo: "locked",
        },
    ];

    const desbloqueadas = conquistas.filter((item) => item.desbloqueada).length;

    return (
        <Layout>
            <section className="perfil-page">
                <header className="perfil-header">
                    <div>
                        <h1>Perfil</h1>
                        <p>Gerencie sua evolução e visualize suas conquistas.</p>
                    </div>
                </header>

                <section className="perfil-top-grid">
                    <div className="profile-summary-card">
                        <div
                            className="avatar-ring"
                            style={{
                                background: `conic-gradient(
      #4f7df3 ${progressoXp * 3.6}deg,
      #eef2ff 0deg
    )`,
                            }}
                        >
                            <div className="avatar-circle">
                                {usuario.nome?.charAt(0).toUpperCase() || "U"}
                            </div>

                            <span>NÍVEL {nivel}</span>
                        </div>

                        <h2>{usuario.nome}</h2>
                        <p>{usuario.email}</p>

                        <div className="xp-box">
                            <div className="xp-info">
                                <span>PROGRESSO XP</span>
                                <strong>
                                    {xpAtual} / {xpProximoNivel} XP
                                </strong>
                            </div>

                            <div className="xp-bar">
                                <div
                                    className="xp-fill"
                                    style={{ width: `${progressoXp}%` }}
                                ></div>
                            </div>

                            <small>Faltam {xpRestante} XP para o próximo nível</small>
                        </div>
                    </div>

                    <div className="profile-info-card">
                        <h2>Informações do Perfil</h2>

                        <form onSubmit={salvarPerfil}>
                            <div className="form-row">
                                <label>
                                    Nome
                                    <input
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                    />
                                </label>

                                <label>
                                    E-mail
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </label>
                            </div>

                            <div className="profile-stats">
                                <div>
                                    <span className="stat-icon orange">
                                        <LuFlame />
                                    </span>

                                    <p>Sequência</p>
                                    <strong>{dashboard.sequencia_dias} dias</strong>
                                </div>

                                <div>
                                    <span className="stat-icon blue">
                                        <LuClock />
                                    </span>

                                    <p>Foco</p>
                                    <strong>{dashboard.tempo_total_foco} min</strong>
                                </div>

                                <div>
                                    <span className="stat-icon blue">
                                        <LuSquareCheck />
                                    </span>

                                    <p>Tarefas</p>
                                    <strong>{dashboard.tarefas_concluidas}</strong>
                                </div>
                            </div>

                            {mensagem && <p className="perfil-message">{mensagem}</p>}

                            <button type="submit">Salvar alterações</button>
                        </form>
                    </div>
                </section>

                <section className="achievements-card">
                    <div className="achievements-header">
                        <h2>Minhas Conquistas</h2>

                        <span>
                            {desbloqueadas} de {conquistas.length} desbloqueadas
                        </span>
                    </div>

                    <div className="achievements-grid">
                        {conquistas.map((conquista) => (
                            <div
                                key={conquista.titulo}
                                className={
                                    conquista.desbloqueada
                                        ? `achievement-item unlocked ${conquista.tipo}`
                                        : "achievement-item locked"
                                }
                            >
                                <div className="achievement-icon">{conquista.icone}</div>

                                <strong>{conquista.titulo}</strong>
                                <p>{conquista.descricao}</p>

                                {!conquista.desbloqueada && (
                                    <div className="locked-bar">
                                        <span></span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </section>
        </Layout>
    );
}

export default Perfil;