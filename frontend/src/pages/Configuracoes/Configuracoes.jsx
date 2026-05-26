import { useEffect, useState } from "react";
import { LuBell, LuShieldAlert } from "react-icons/lu";

import api from "../../services/api";
import Layout from "../../components/Layout/Layout";
import "./Configuracoes.css";

function Configuracoes() {
  const [dashboard, setDashboard] = useState(null);

  const [lembretesTarefas, setLembretesTarefas] = useState(true);
  const [pausaPomodoro, setPausaPomodoro] = useState(true);
  const [resumoSemanal, setResumoSemanal] = useState(true);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const response = await api.get("/dashboard");
        setDashboard(response.data);
      } catch (error) {
        console.log(error.response?.data || error);
      }
    }

    carregarDashboard();
  }, []);

  const xpAtual = dashboard?.xp || 0;
  const nivel = dashboard?.nivel || 1;
  const xpProximoNivel = nivel * 100;
  const progressoXp = Math.min((xpAtual / xpProximoNivel) * 100, 100);

  function alterarSenha() {
    alert("Depois podemos criar um modal para alterar senha.");
  }

  function excluirConta() {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir sua conta?"
    );

    if (!confirmar) {
      return;
    }

    alert("Funcionalidade de excluir conta ainda não implementada.");
  }

  return (
    <Layout>
      <section className="config-page">
        <header className="config-header">
          <div>
            <h1>Configurações</h1>
            <p>Personalize sua experiência.</p>
          </div>

          <div className="level-card">
            <div className="level-info">
              <strong>Nível {nivel}</strong>
              <span>{xpAtual} / {xpProximoNivel} XP</span>
            </div>

            <div className="level-bar">
              <div
                className="level-progress"
                style={{ width: `${progressoXp}%` }}
              ></div>
            </div>
          </div>
        </header>

        <section className="settings-card">
          <div className="settings-title">
            <LuBell />
            <h2>Notificações</h2>
          </div>

          <div className="setting-row">
            <div>
              <h3>Lembretes de tarefas</h3>
              <p>Receba avisos antes do prazo de cada tarefa.</p>
            </div>

            <button
              className={lembretesTarefas ? "switch active" : "switch"}
              onClick={() => setLembretesTarefas(!lembretesTarefas)}
            >
              <span></span>
            </button>
          </div>

          <div className="setting-row">
            <div>
              <h3>Pausa do pomodoro</h3>
              <p>Som ao finalizar uma sessão de foco.</p>
            </div>

            <button
              className={pausaPomodoro ? "switch active" : "switch"}
              onClick={() => setPausaPomodoro(!pausaPomodoro)}
            >
              <span></span>
            </button>
          </div>

          <div className="setting-row">
            <div>
              <h3>Resumo semanal</h3>
              <p>Receba seu progresso por email todo domingo.</p>
            </div>

            <button
              className={resumoSemanal ? "switch active" : "switch"}
              onClick={() => setResumoSemanal(!resumoSemanal)}
            >
              <span></span>
            </button>
          </div>
        </section>

        <section className="account-card">
          <div className="account-title">
            <LuShieldAlert />
            <h2>Conta</h2>
          </div>

          <div className="account-actions">
            <button className="password-btn" onClick={alterarSenha}>
              Alterar senha
            </button>

            <button className="delete-account-btn" onClick={excluirConta}>
              Excluir conta
            </button>
          </div>
        </section>
      </section>
    </Layout>
  );
}

export default Configuracoes;