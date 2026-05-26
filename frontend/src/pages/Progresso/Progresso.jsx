import { useEffect, useState } from "react";
import {
  LuTrendingUp,
  LuStar,
  LuCircleCheck,
  LuTimer,
  LuSmile,
} from "react-icons/lu";

import api from "../../services/api";
import Layout from "../../components/Layout/Layout";
import "./Progresso.css";

function Progresso() {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    async function carregarProgresso() {
      try {
        const response = await api.get("/dashboard");
        setDados(response.data);
      } catch (error) {
        console.log(error.response?.data || error);
      }
    }

    carregarProgresso();
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
      <section className="progresso-page">
        <header className="progresso-header">
          <div>
            <h1>Progresso</h1>
            <p>Acompanhe sua evolução acadêmica.</p>
          </div>
        </header>

        <section className="progress-main-card">
          <div className="progress-title">
            <LuTrendingUp />
            <h2>Nível {nivel}</h2>
          </div>

          <p>{xpAtual} / {xpProximoNivel} XP</p>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressoXp}%` }}
            ></div>
          </div>
        </section>

        <section className="progresso-grid">
          <div className="progress-card">
            <LuStar />
            <span>XP acumulado</span>
            <strong>{dados.xp}</strong>
          </div>

          <div className="progress-card">
            <LuCircleCheck />
            <span>Tarefas concluídas</span>
            <strong>{dados.tarefas_concluidas}</strong>
          </div>

          <div className="progress-card">
            <LuTimer />
            <span>Tempo de foco</span>
            <strong>{dados.tempo_total_foco} min</strong>
          </div>

          <div className="progress-card">
            <LuSmile />
            <span>Último humor</span>
            <strong>{dados.ultimo_humor || "Nenhum"}</strong>
          </div>
        </section>

        <section className="progress-summary">
          <h2>Resumo das tarefas</h2>

          <div className="summary-row">
            <div>
              <span>Total</span>
              <strong>{dados.total_tarefas}</strong>
            </div>

            <div>
              <span>Pendentes</span>
              <strong>{dados.tarefas_pendentes}</strong>
            </div>

            <div>
              <span>Concluídas</span>
              <strong>{dados.tarefas_concluidas}</strong>
            </div>

            <div>
              <span>Progresso</span>
              <strong>{dados.progresso}%</strong>
            </div>
          </div>
        </section>
      </section>
    </Layout>
  );
}

export default Progresso;