import { useEffect, useState } from "react";
import {
  LuPlay,
  LuPause,
  LuRotateCcw,
} from "react-icons/lu";

import api from "../../services/api";
import Layout from "../../components/Layout/Layout";
import "./Foco.css";

function Foco() {
  const opcoesTempo = [
    { nome: "Pomodoro", minutos: 25 },
    { nome: "Pausa curta", minutos: 5 },
    { nome: "Pausa longa", minutos: 15 },
    { nome: "Estudo profundo", minutos: 50 },
  ];

  const [tempoSelecionado, setTempoSelecionado] = useState(opcoesTempo[0]);
  const [tempo, setTempo] = useState(opcoesTempo[0].minutos * 60);
  const [rodando, setRodando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tempoHoje, setTempoHoje] = useState(0);

  useEffect(() => {
    let intervalo;

    if (rodando && tempo > 0) {
      intervalo = setInterval(() => {
        setTempo((valorAtual) => valorAtual - 1);
      }, 1000);
    }

    if (tempo === 0 && rodando) {
      finalizarSessao();
    }

    return () => clearInterval(intervalo);
  }, [rodando, tempo]);

  async function carregarFoco() {
    try {
      const response = await api.get("/foco");

      if (!response.data || response.data.length === 0) {
        setTempoHoje(0);
        return;
      }

      const hoje = new Date().toDateString();

      const totalHoje = response.data
        .filter((sessao) => {
          const dataSessao = new Date(
            sessao.data_registro
          ).toDateString();

          return dataSessao === hoje;
        })
        .reduce(
          (soma, sessao) =>
            soma + sessao.tempo_minutos,
          0
        );

      setTempoHoje(totalHoje);
    } catch (error) {
      console.log(error.response?.data || error);
    }
  }

  useEffect(() => {
    carregarFoco();
  }, []);

  function trocarTempo(opcao) {
    setTempoSelecionado(opcao);
    setTempo(opcao.minutos * 60);
    setRodando(false);
    setMensagem("");
  }

  function formatarTempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;

    return `${String(minutos).padStart(2, "0")}:${String(
      resto
    ).padStart(2, "0")}`;
  }

  function formatarMinutos(minutos) {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;

    if (horas > 0) {
      return `${horas}h ${resto}min`;
    }

    return `${resto}min`;
  }

  function iniciar() {
    setMensagem("");
    setRodando(true);
  }

  function pausar() {
    setRodando(false);
  }

  function resetar() {
    setRodando(false);
    setTempo(tempoSelecionado.minutos * 60);
    setMensagem("");
  }

  async function finalizarSessao() {
    try {
      setRodando(false);

      await api.post("/foco", {
        tempo_minutos: tempoSelecionado.minutos,
      });

      setMensagem("Sessão registrada com sucesso!");
      setTempo(tempoSelecionado.minutos * 60);

      carregarFoco();
    } catch (error) {
      console.log(error.response?.data || error);
      setMensagem("Erro ao registrar sessão.");
    }
  }

  const tempoTotal = tempoSelecionado.minutos * 60;

  const progresso =
    ((tempoTotal - tempo) / tempoTotal) * 100;

  return (
    <Layout>
      <section className="foco-page">
        <header className="foco-top">
          <div>
            <h1>Temporizador de Foco</h1>

            <p>
              Use o método Pomodoro para estudar com mais concentração.
            </p>
          </div>
        </header>

        <section className="foco-content">
          <div className="timer-card">
            <div
              className="timer-ring"
              style={{
                background: `conic-gradient(
                #2b159c 0deg,
                #546cff ${progresso * 1.8}deg,
                #63c7ec ${progresso * 3.6}deg,
                #eef2ff ${progresso * 3.6}deg
              )`,
              }}
            >
              <div className="timer-inner">
                <strong>{formatarTempo(tempo)}</strong>

                <span>
                  {rodando ? "Rodando" : "Pausado"}
                </span>
              </div>
            </div>

            <div className="timer-actions">
              {!rodando ? (
                <button onClick={iniciar}>
                  <LuPlay />
                  Iniciar
                </button>
              ) : (
                <button onClick={pausar}>
                  <LuPause />
                  Pausar
                </button>
              )}

              <button
                className="reset-btn"
                onClick={resetar}
              >
                <LuRotateCcw />
                Resetar
              </button>
            </div>

            {mensagem && (
              <p className="focus-message">
                {mensagem}
              </p>
            )}
          </div>

          <aside className="focus-side-card">
            <h2>Predefinições</h2>

            <div className="preset-list">
              {opcoesTempo.map((opcao) => (
                <button
                  key={opcao.nome}
                  className={
                    tempoSelecionado.nome === opcao.nome
                      ? "preset-btn active"
                      : "preset-btn"
                  }
                  onClick={() =>
                    trocarTempo(opcao)
                  }
                >
                  <span>{opcao.nome}</span>

                  <strong>
                    {opcao.minutos} min
                  </strong>
                </button>
              ))}
            </div>

            <div className="today-focus">
              <span>Hoje</span>

              <strong>
                {formatarMinutos(tempoHoje)}
              </strong>

              <p>em sessões de foco</p>
            </div>
          </aside>
        </section>
      </section>
    </Layout>
  );
}

export default Foco;