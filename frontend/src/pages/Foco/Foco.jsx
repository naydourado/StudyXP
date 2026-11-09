import { useCallback, useEffect, useRef, useState } from "react";
import { LuPlay, LuPause, LuRotateCcw, LuSquare } from "react-icons/lu";

import api, { mensagemDeErro } from "../../services/api";
import Layout from "../../components/Layout/Layout";
import NivelCard from "../../components/NivelCard/NivelCard";
import XpToast from "../../components/XpToast/XpToast";
import { formatarMinutos } from "../../constants/gamificacao";
import "./Foco.css";

const PREDEFINICOES = [
  { nome: "Pomodoro", minutos: 25, tipo: "foco" },
  { nome: "Pausa curta", minutos: 5, tipo: "pausa_curta" },
  { nome: "Pausa longa", minutos: 15, tipo: "pausa_longa" },
  { nome: "Estudo profundo", minutos: 50, tipo: "foco" },
];

function formatarRelogio(ms) {
  const totalSegundos = Math.ceil(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

// bipe curto gerado pelo navegador (sem arquivo de audio)
function tocarAviso() {
  try {
    const contexto = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach((inicio) => {
      const oscilador = contexto.createOscillator();
      const volume = contexto.createGain();
      oscilador.frequency.value = 880;
      volume.gain.setValueAtTime(0.2, contexto.currentTime + inicio);
      volume.gain.exponentialRampToValueAtTime(0.001, contexto.currentTime + inicio + 0.3);
      oscilador.connect(volume).connect(contexto.destination);
      oscilador.start(contexto.currentTime + inicio);
      oscilador.stop(contexto.currentTime + inicio + 0.3);
    });
  } catch {
    // navegador sem suporte a audio: segue sem som
  }
}

function Foco() {
  const [predefinicao, setPredefinicao] = useState(PREDEFINICOES[0]);
  // estado: "parado" | "rodando" | "pausado"
  const [estado, setEstado] = useState("parado");
  const [restanteMs, setRestanteMs] = useState(PREDEFINICOES[0].minutos * 60000);
  const [mensagem, setMensagem] = useState("");
  const [resumoHoje, setResumoHoje] = useState(null);
  const [gamificacao, setGamificacao] = useState(null);
  const [resultadoXp, setResultadoXp] = useState(null);
  const [somAtivo, setSomAtivo] = useState(true);

  // o timer usa o horario de termino: nao atrasa com a aba em segundo plano
  const fimEm = useRef(null);
  const sessaoId = useRef(null);
  const finalizando = useRef(false);

  const fecharToast = useCallback(() => setResultadoXp(null), []);

  // incrementar a versao recarrega o resumo de hoje
  const [versao, setVersao] = useState(0);
  const carregarResumo = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    let ativo = true;
    Promise.all([api.get("/foco/resumo-hoje"), api.get("/gamificacao/status")])
      .then(([resumo, status]) => {
        if (!ativo) return;
        setResumoHoje(resumo.data);
        setGamificacao(status.data);
      })
      .catch((error) => ativo && setMensagem(mensagemDeErro(error, "Não foi possível carregar o resumo de hoje.")));
    return () => {
      ativo = false;
    };
  }, [versao]);

  useEffect(() => {
    api
      .get("/me/preferencias")
      .then((resposta) => setSomAtivo(resposta.data.som_pomodoro))
      .catch(() => {});
  }, []);

  const finalizar = useCallback(async () => {
    if (finalizando.current || !sessaoId.current) return;
    finalizando.current = true;

    try {
      const resposta = await api.post(`/foco/sessoes/${sessaoId.current}/finalizar`);
      const { sessao } = resposta.data;
      setResultadoXp(resposta.data);
      setGamificacao(resposta.data.gamificacao);
      setMensagem(
        sessao.status === "concluida"
          ? "Sessão concluída! Bom trabalho."
          : `Sessão encerrada com ${sessao.minutos_validos} min de foco.`
      );
      carregarResumo();
    } catch (error) {
      setMensagem(mensagemDeErro(error, "Erro ao registrar a sessão."));
    } finally {
      sessaoId.current = null;
      fimEm.current = null;
      finalizando.current = false;
      setEstado("parado");
      setRestanteMs(predefinicao.minutos * 60000);
    }
  }, [carregarResumo, predefinicao]);

  useEffect(() => {
    if (estado !== "rodando") return undefined;

    const intervalo = setInterval(() => {
      const restante = Math.max(0, fimEm.current - Date.now());
      setRestanteMs(restante);
      if (restante === 0) {
        clearInterval(intervalo);
        if (somAtivo) tocarAviso();
        finalizar();
      }
    }, 250);

    return () => clearInterval(intervalo);
  }, [estado, finalizar, somAtivo]);

  async function iniciar() {
    setMensagem("");

    if (!sessaoId.current) {
      try {
        const resposta = await api.post("/foco/sessoes", {
          tipo: predefinicao.tipo,
          duracao_planejada: predefinicao.minutos,
        });
        sessaoId.current = resposta.data.id;
      } catch (error) {
        setMensagem(mensagemDeErro(error, "Não foi possível iniciar a sessão."));
        return;
      }
    }

    fimEm.current = Date.now() + restanteMs;
    setEstado("rodando");
  }

  function pausar() {
    setRestanteMs(Math.max(0, fimEm.current - Date.now()));
    setEstado("pausado");
  }

  async function cancelarSessaoAtual() {
    if (sessaoId.current) {
      const id = sessaoId.current;
      sessaoId.current = null;
      await api.post(`/foco/sessoes/${id}/cancelar`).catch(() => {});
    }
  }

  async function resetar(nova = predefinicao) {
    await cancelarSessaoAtual();
    fimEm.current = null;
    setEstado("parado");
    setRestanteMs(nova.minutos * 60000);
    setMensagem("");
  }

  function trocarPredefinicao(opcao) {
    if (estado !== "parado" && !window.confirm("Trocar agora cancela a sessão atual. Continuar?")) {
      return;
    }
    setPredefinicao(opcao);
    resetar(opcao);
  }

  const totalMs = predefinicao.minutos * 60000;
  const progresso = ((totalMs - restanteMs) / totalMs) * 100;
  const rotuloEstado = { parado: "Pronto", rodando: "Focando", pausado: "Pausado" }[estado];

  return (
    <Layout>
      <section className="foco-page">
        <header className="foco-top">
          <div>
            <h1>Temporizador de Foco</h1>
            <p>Use o método Pomodoro para estudar com mais concentração.</p>
          </div>

          <NivelCard gamificacao={gamificacao} />
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
                <strong aria-live="off">{formatarRelogio(restanteMs)}</strong>
                <span>{rotuloEstado}</span>
              </div>
            </div>

            <div className="timer-actions">
              {estado === "rodando" ? (
                <button onClick={pausar}>
                  <LuPause />
                  Pausar
                </button>
              ) : (
                <button onClick={iniciar}>
                  <LuPlay />
                  {estado === "pausado" ? "Continuar" : "Iniciar"}
                </button>
              )}

              {estado !== "parado" && (
                <button className="reset-btn" onClick={finalizar} title="Encerra e salva os minutos já focados">
                  <LuSquare />
                  Encerrar
                </button>
              )}

              <button className="reset-btn" onClick={() => resetar()}>
                <LuRotateCcw />
                Resetar
              </button>
            </div>

            {mensagem && (
              <p className="focus-message" role="status">
                {mensagem}
              </p>
            )}
          </div>

          <aside className="focus-side-card">
            <h2>Predefinições</h2>

            <div className="preset-list">
              {PREDEFINICOES.map((opcao) => (
                <button
                  key={opcao.nome}
                  aria-pressed={predefinicao.nome === opcao.nome}
                  className={predefinicao.nome === opcao.nome ? "preset-btn active" : "preset-btn"}
                  onClick={() => trocarPredefinicao(opcao)}
                >
                  <span>{opcao.nome}</span>
                  <strong>{opcao.minutos} min</strong>
                </button>
              ))}
            </div>

            <div className="today-focus">
              <span>Hoje</span>
              <strong>{formatarMinutos(resumoHoje?.minutos_foco ?? 0)}</strong>
              <p>em sessões de foco</p>
            </div>
          </aside>
        </section>
      </section>

      <XpToast resultado={resultadoXp} aoFechar={fecharToast} />
    </Layout>
  );
}

export default Foco;
