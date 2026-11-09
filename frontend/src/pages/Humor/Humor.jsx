import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuSmile, LuShieldCheck, LuTrash2 } from "react-icons/lu";

import api, { mensagemDeErro } from "../../services/api";
import Layout from "../../components/Layout/Layout";
import NivelCard from "../../components/NivelCard/NivelCard";
import XpToast from "../../components/XpToast/XpToast";
import { HUMORES, humorPorValor } from "../../constants/gamificacao";
import "./Humor.css";

function dataRelativa(iso) {
  // o servidor devolve utc sem fuso; o "Z" faz o navegador converter para o horario local
  const data = new Date(`${iso}Z`);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  if (data.toDateString() === hoje.toDateString()) return "Hoje";
  if (data.toDateString() === ontem.toDateString()) return "Ontem";
  return data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
}

// termo de consentimento especifico para o dado sensivel (lgpd art. 11, i)
function Consentimento({ aoAutorizar, enviando, erro }) {
  return (
    <div className="humor-card consentimento-card">
      <div className="card-title">
        <LuShieldCheck />
        <h2>Antes de começar</h2>
      </div>

      <p>
        O registro de humor guarda <strong>como você se sente</strong> e, se quiser, uma nota curta. Esse é um
        dado pessoal sensível, então só vamos guardá-lo com a sua autorização.
      </p>

      <ul>
        <li>Serve apenas para você acompanhar a relação entre humor e estudos.</li>
        <li>As notas ficam criptografadas e ninguém além de você as vê.</li>
        <li>Não compartilhamos esses dados com terceiros.</li>
        <li>
          Você pode revogar quando quiser em Configurações — todos os registros de humor são apagados na hora.
        </li>
      </ul>

      <p className="consentimento-aviso">
        O StudyXP não substitui acompanhamento profissional. Se precisar conversar, o CVV atende 24h pelo 188.
      </p>

      {erro && (
        <p className="error-message" role="alert">
          {erro}
        </p>
      )}

      <div className="consentimento-acoes">
        <Link to="/dashboard" className="consentimento-depois">
          Agora não
        </Link>
        <button className="save-humor-btn" onClick={aoAutorizar} disabled={enviando}>
          Autorizo o uso dos meus dados de humor
        </button>
      </div>

      <p className="consentimento-link">
        Detalhes na <Link to="/privacidade">Política de Privacidade</Link>.
      </p>
    </div>
  );
}

function Humor() {
  const [autorizado, setAutorizado] = useState(null);
  const [humorSelecionado, setHumorSelecionado] = useState("");
  const [observacao, setObservacao] = useState("");
  const [registros, setRegistros] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [gamificacao, setGamificacao] = useState(null);
  const [resultadoXp, setResultadoXp] = useState(null);

  const fecharToast = useCallback(() => setResultadoXp(null), []);

  const carregarRegistros = useCallback(async () => {
    try {
      const resposta = await api.get("/humor");
      setRegistros(resposta.data);
    } catch (error) {
      setErro(mensagemDeErro(error));
    }
  }, []);

  useEffect(() => {
    api
      .get("/gamificacao/status")
      .then((resposta) => setGamificacao(resposta.data))
      .catch(() => {});

    api
      .get("/me/consentimentos")
      .then((resposta) => {
        setAutorizado(resposta.data.humor);
        if (resposta.data.humor) carregarRegistros();
      })
      .catch((error) => setErro(mensagemDeErro(error)));
  }, [carregarRegistros]);

  async function autorizar() {
    setEnviando(true);
    setErro("");
    try {
      await api.put("/me/consentimentos", { humor: true });
      setAutorizado(true);
      carregarRegistros();
    } catch (error) {
      setErro(mensagemDeErro(error));
    } finally {
      setEnviando(false);
    }
  }

  async function registrarHumor(e) {
    e.preventDefault();
    setMensagem("");

    if (!humorSelecionado) {
      setMensagem("Selecione como você está.");
      return;
    }

    setEnviando(true);
    try {
      const resposta = await api.post("/humor", {
        humor: humorSelecionado,
        observacao: observacao.trim() || null,
      });
      setResultadoXp(resposta.data);
      setGamificacao(resposta.data.gamificacao);
      setHumorSelecionado("");
      setObservacao("");
      setMensagem("Registro salvo!");
      carregarRegistros();
    } catch (error) {
      setMensagem(mensagemDeErro(error, "Erro ao registrar humor."));
    } finally {
      setEnviando(false);
    }
  }

  async function excluirRegistro(id) {
    if (!window.confirm("Apagar este registro?")) return;
    try {
      await api.delete(`/humor/${id}`);
      setRegistros((atuais) => atuais.filter((registro) => registro.id !== id));
    } catch (error) {
      setErro(mensagemDeErro(error));
    }
  }

  return (
    <Layout>
      <section className="humor-page">
        <header className="humor-header">
          <div>
            <h1>Registro de Humor</h1>
            <p>Acompanhe como você se sente ao estudar.</p>
          </div>

          <NivelCard gamificacao={gamificacao} />
        </header>

        {autorizado === null && <p className="carregando-pagina">{erro || "Carregando..."}</p>}

        {autorizado === false && <Consentimento aoAutorizar={autorizar} enviando={enviando} erro={erro} />}

        {autorizado && (
          <section className="humor-content">
            <div className="humor-card">
              <div className="card-title">
                <LuSmile />
                <h2>Como você está hoje?</h2>
              </div>

              <form onSubmit={registrarHumor}>
                <div className="humor-options" role="radiogroup" aria-label="Humor">
                  {HUMORES.map((humor) => (
                    <button
                      key={humor.valor}
                      type="button"
                      role="radio"
                      aria-label={humor.nome}
                      aria-checked={humorSelecionado === humor.valor}
                      className={humorSelecionado === humor.valor ? "humor-option active" : "humor-option"}
                      onClick={() => setHumorSelecionado(humor.valor)}
                    >
                      <span aria-hidden="true">{humor.emoji}</span>
                      <small>{humor.nome}</small>
                    </button>
                  ))}
                </div>

                <label htmlFor="humor-nota">Quer adicionar uma nota sobre o seu dia? (opcional)</label>
                <textarea
                  id="humor-nota"
                  placeholder="Escreva algo sobre seu dia de estudos..."
                  maxLength={500}
                  aria-describedby="humor-nota-ajuda"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
                <small id="humor-nota-ajuda" className="campo-ajuda">
                  A nota fica criptografada e só você vê. Evite escrever dados de outras pessoas.
                </small>

                {mensagem && <p className="humor-message">{mensagem}</p>}

                <button className="save-humor-btn" type="submit" disabled={enviando}>
                  Salvar Registro
                </button>
              </form>
            </div>

            <div className="historico-card">
              <h2>Histórico</h2>

              {registros.length > 0 ? (
                registros.map((registro) => {
                  const humor = humorPorValor(registro.humor);
                  return (
                    <div className="historico-item" key={registro.id}>
                      <span className="historico-emoji" aria-hidden="true">
                        {humor?.emoji}
                      </span>
                      <div>
                        <strong>
                          {dataRelativa(registro.criado_em)} · {humor?.nome}
                        </strong>
                        <p>{registro.observacao || "Sem nota."}</p>
                      </div>
                      <button
                        className="historico-excluir"
                        aria-label="Apagar registro"
                        onClick={() => excluirRegistro(registro.id)}
                      >
                        <LuTrash2 />
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="empty-text">Nenhum registro ainda.</p>
              )}
            </div>
          </section>
        )}
      </section>

      <XpToast resultado={resultadoXp} aoFechar={fecharToast} />
    </Layout>
  );
}

export default Humor;
