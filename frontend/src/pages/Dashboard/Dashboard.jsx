import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuCircleCheck, LuCircle, LuFlame, LuTimer, LuSmile, LuArrowRight } from "react-icons/lu";

import api, { mensagemDeErro } from "../../services/api";
import Layout from "../../components/Layout/Layout";
import NivelCard from "../../components/NivelCard/NivelCard";
import XpToast from "../../components/XpToast/XpToast";
import { HUMORES, formatarMinutos, nomePrioridade, textoPrazo } from "../../constants/gamificacao";
import "./Dashboard.css";

function Dashboard() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [resultadoXp, setResultadoXp] = useState(null);
  const [mensagemHumor, setMensagemHumor] = useState("");

  // incrementar a versao recarrega os dados
  const [versao, setVersao] = useState(0);
  const carregar = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    let ativo = true;
    api
      .get("/dashboard")
      .then((resposta) => {
        if (!ativo) return;
        setDados(resposta.data);
        setErro("");
      })
      .catch((error) => ativo && setErro(mensagemDeErro(error, "Não foi possível carregar o dashboard.")));
    return () => {
      ativo = false;
    };
  }, [versao]);

  const fecharToast = useCallback(() => setResultadoXp(null), []);

  async function alternarTarefa(tarefa) {
    const acao = tarefa.status === "concluida" ? "reabrir" : "concluir";
    try {
      const resposta = await api.post(`/tarefas/${tarefa.id}/${acao}`);
      setResultadoXp(resposta.data);
      carregar();
    } catch (error) {
      setErro(mensagemDeErro(error));
    }
  }

  async function registrarHumorRapido(humor) {
    try {
      const resposta = await api.post("/humor", { humor });
      setResultadoXp(resposta.data);
      setMensagemHumor("Humor registrado!");
      carregar();
    } catch (error) {
      setMensagemHumor(mensagemDeErro(error));
    }
  }

  if (!dados) {
    return (
      <Layout>
        <p className="carregando-pagina">{erro || "Carregando..."}</p>
      </Layout>
    );
  }

  const ofensiva = dados.gamificacao.ofensiva_atual;

  return (
    <Layout>
      <section className="dashboard-page">
        <header className="dashboard-top">
          <div>
            <h1>Olá, {dados.usuario.nome}!</h1>
            <p>Hora de Estudar.</p>
          </div>

          <NivelCard gamificacao={dados.gamificacao} />
        </header>

        {erro && (
          <p className="error-message" role="alert">
            {erro}
          </p>
        )}

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

            <div className="dashboard-task-list">
              {dados.tarefas.length > 0 ? (
                dados.tarefas.map((tarefa) => (
                  <div
                    className={tarefa.status === "concluida" ? "task-item task-done" : "task-item"}
                    key={tarefa.id}
                  >
                    <button
                      className="task-check"
                      aria-label={tarefa.status === "concluida" ? "Reabrir tarefa" : "Concluir tarefa"}
                      onClick={() => alternarTarefa(tarefa)}
                    >
                      {tarefa.status === "concluida" ? <LuCircleCheck /> : <LuCircle />}
                    </button>

                    <Link to="/tarefas" className="task-text">
                      <strong>{tarefa.titulo}</strong>
                      <span>
                        {textoPrazo(tarefa.data_prazo)} · {nomePrioridade(tarefa.prioridade)}
                      </span>
                    </Link>

                    <span className="xp-badge">+{tarefa.xp_recompensa}xp</span>
                  </div>
                ))
              ) : (
                <p className="empty-text">Nenhuma tarefa por aqui. Que tal criar uma?</p>
              )}
            </div>
          </div>

          <div className="dash-card sequence-card">
            <div className="card-title">
              <LuFlame />
              <h2>Sua sequência</h2>
            </div>

            <div className="sequence-number">
              <strong>{ofensiva}</strong>
              <span>{ofensiva === 1 ? "dia seguido" : "dias seguidos"}</span>
            </div>

            <div className="week-row">
              {dados.semana.map((dia) => (
                <div className="week-day" key={dia.data}>
                  <div className={dia.ativo ? "day active" : "day"} />
                  <span>{dia.dia_semana.charAt(0).toUpperCase() + dia.dia_semana.slice(1)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-card focus-card">
            <div className="card-title">
              <LuTimer />
              <h2>Sessão de Foco</h2>
            </div>

            <p>
              {dados.foco_hoje_minutos > 0
                ? `Hoje você já focou ${formatarMinutos(dados.foco_hoje_minutos)}. Bora mais um?`
                : "Bora estudar? Inicie um pomodoro de 25 minutos."}
            </p>

            <Link to="/foco" className="focus-link">
              Iniciar foco
            </Link>
          </div>

          <div className="dash-card mood-card">
            <div className="card-title">
              <LuSmile />
              <h2>Como você está?</h2>
            </div>

            <p>Registrar o humor te ajuda a entender seus padrões de estudo.</p>

            {dados.humor_autorizado ? (
              <div className="mood-options">
                {HUMORES.map((humor) => (
                  <button
                    key={humor.valor}
                    title={humor.nome}
                    aria-label={humor.nome}
                    onClick={() => registrarHumorRapido(humor.valor)}
                  >
                    {humor.emoji}
                  </button>
                ))}
              </div>
            ) : (
              <Link to="/humor" className="mood-options" aria-label="Registrar como você está">
                {HUMORES.map((humor) => (
                  <span key={humor.valor} className="mood-emoji" aria-hidden="true">
                    {humor.emoji}
                  </span>
                ))}
              </Link>
            )}

            {mensagemHumor && <p className="mood-message">{mensagemHumor}</p>}
          </div>
        </section>
      </section>

      <XpToast resultado={resultadoXp} aoFechar={fecharToast} />
    </Layout>
  );
}

export default Dashboard;
