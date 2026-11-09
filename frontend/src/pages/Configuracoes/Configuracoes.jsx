import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuBell, LuShieldAlert, LuLock } from "react-icons/lu";

import api, { mensagemDeErro } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Layout from "../../components/Layout/Layout";
import NivelCard from "../../components/NivelCard/NivelCard";
import "./Configuracoes.css";

const OPCOES_NOTIFICACAO = [
  {
    campo: "lembrete_tarefas",
    titulo: "Lembretes de tarefas",
    descricao: "Receba avisos antes do prazo de cada tarefa.",
  },
  {
    campo: "som_pomodoro",
    titulo: "Pausa do pomodoro",
    descricao: "Som ao finalizar uma sessão de foco.",
  },
  {
    campo: "resumo_semanal",
    titulo: "Resumo semanal",
    descricao: "Receba seu progresso por e-mail todo domingo.",
  },
];

function Interruptor({ ligado, aoAlternar, rotulo }) {
  return (
    <button
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      className={ligado ? "switch active" : "switch"}
      onClick={aoAlternar}
    >
      <span></span>
    </button>
  );
}

function Configuracoes() {
  const navigate = useNavigate();
  const { encerrarLocalmente } = useAuth();

  const [gamificacao, setGamificacao] = useState(null);
  const [preferencias, setPreferencias] = useState(null);
  const [humorAutorizado, setHumorAutorizado] = useState(false);
  const [erroGeral, setErroGeral] = useState("");
  const [mensagemDados, setMensagemDados] = useState("");

  const [abrirSenha, setAbrirSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [mensagemSenha, setMensagemSenha] = useState("");

  const [modalExcluir, setModalExcluir] = useState(false);
  const [senhaExclusao, setSenhaExclusao] = useState("");
  const [mensagemExcluir, setMensagemExcluir] = useState("");

  useEffect(() => {
    Promise.all([api.get("/gamificacao/status"), api.get("/me/preferencias"), api.get("/me/consentimentos")])
      .then(([status, prefs, consentimentos]) => {
        setGamificacao(status.data);
        setPreferencias(prefs.data);
        setHumorAutorizado(consentimentos.data.humor);
      })
      .catch((error) => setErroGeral(mensagemDeErro(error, "Não foi possível carregar as configurações.")));
  }, []);

  async function alternarPreferencia(campo) {
    const anteriores = preferencias;
    const novas = { ...preferencias, [campo]: !preferencias[campo] };
    setPreferencias(novas);
    try {
      await api.put("/me/preferencias", novas);
    } catch (error) {
      setPreferencias(anteriores);
      setErroGeral(mensagemDeErro(error, "Não foi possível salvar a preferência."));
    }
  }

  async function alterarSenha(e) {
    e.preventDefault();
    try {
      await api.put("/me/senha", { senha_atual: senhaAtual, nova_senha: novaSenha });
      setMensagemSenha("Senha alterada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setTimeout(() => {
        setAbrirSenha(false);
        setMensagemSenha("");
      }, 1500);
    } catch (error) {
      setMensagemSenha(mensagemDeErro(error, "Erro ao alterar senha."));
    }
  }

  async function exportarDados() {
    setMensagemDados("");
    try {
      const resposta = await api.get("/me/exportar");
      const arquivo = new Blob([JSON.stringify(resposta.data, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(arquivo);
      link.download = `studyxp-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      setMensagemDados("Arquivo com seus dados baixado.");
    } catch (error) {
      setMensagemDados(mensagemDeErro(error, "Não foi possível exportar os dados."));
    }
  }

  async function alternarConsentimentoHumor() {
    if (
      humorAutorizado &&
      !window.confirm("Revogar a autorização apaga todos os seus registros de humor. Continuar?")
    ) {
      return;
    }
    try {
      const resposta = await api.put("/me/consentimentos", { humor: !humorAutorizado });
      setHumorAutorizado(resposta.data.humor);
      setMensagemDados(resposta.data.humor ? "Registro de humor autorizado." : "Autorização revogada e registros apagados.");
    } catch (error) {
      setMensagemDados(mensagemDeErro(error));
    }
  }

  async function excluirConta(e) {
    e.preventDefault();
    try {
      await api.delete("/me", { data: { senha: senhaExclusao } });
      encerrarLocalmente();
      navigate("/", { replace: true });
    } catch (error) {
      setMensagemExcluir(mensagemDeErro(error, "Erro ao excluir conta."));
    }
  }

  return (
    <Layout>
      <section className="config-page">
        <header className="config-header">
          <div>
            <h1>Configurações</h1>
            <p>Personalize sua experiência.</p>
          </div>

          <NivelCard gamificacao={gamificacao} />
        </header>

        {erroGeral && (
          <p className="error-message" role="alert">
            {erroGeral}
          </p>
        )}

        <section className="settings-card">
          <div className="settings-title">
            <LuBell />
            <h2>Notificações</h2>
          </div>

          {preferencias &&
            OPCOES_NOTIFICACAO.map((opcao) => (
              <div className="setting-row" key={opcao.campo}>
                <div>
                  <h3>{opcao.titulo}</h3>
                  <p>{opcao.descricao}</p>
                </div>

                <Interruptor
                  rotulo={opcao.titulo}
                  ligado={preferencias[opcao.campo]}
                  aoAlternar={() => alternarPreferencia(opcao.campo)}
                />
              </div>
            ))}
        </section>

        <section className="settings-card">
          <div className="settings-title">
            <LuLock />
            <h2>Privacidade e dados</h2>
          </div>

          <div className="setting-row">
            <div>
              <h3>Registro de humor</h3>
              <p>Autorização para guardar seus registros de humor. Desligar apaga todos eles.</p>
            </div>

            <Interruptor rotulo="Registro de humor" ligado={humorAutorizado} aoAlternar={alternarConsentimentoHumor} />
          </div>

          <div className="setting-row">
            <div>
              <h3>Meus dados</h3>
              <p>Baixe uma cópia de tudo que o StudyXP guarda sobre você (JSON).</p>
            </div>

            <button className="password-btn" onClick={exportarDados}>
              Exportar
            </button>
          </div>

          {mensagemDados && <p className="config-mensagem">{mensagemDados}</p>}

          <p className="config-links">
            <Link to="/privacidade">Política de Privacidade</Link> · <Link to="/termos">Termos de Uso</Link>
          </p>
        </section>

        <section className="account-card">
          <div className="account-title">
            <LuShieldAlert />
            <h2>Conta</h2>
          </div>

          <div className="account-actions">
            <button className="password-btn" onClick={() => setAbrirSenha(true)}>
              Alterar senha
            </button>

            <button className="delete-account-btn" onClick={() => setModalExcluir(true)}>
              Excluir conta
            </button>
          </div>

          {abrirSenha && (
            <div className="senha-modal">
              <form className="senha-box" onSubmit={alterarSenha}>
                <h3>Alterar senha</h3>

                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Senha atual"
                  aria-label="Senha atual"
                  required
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                />

                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Nova senha (mínimo 8 caracteres)"
                  aria-label="Nova senha"
                  required
                  minLength={8}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />

                {mensagemSenha && <p>{mensagemSenha}</p>}

                <div className="senha-actions">
                  <button type="button" className="cancel-btn" onClick={() => setAbrirSenha(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="save-btn">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </section>

      {modalExcluir && (
        <div className="delete-modal-overlay">
          <form className="delete-modal" onSubmit={excluirConta} role="dialog" aria-modal="true">
            <div className="delete-icon">!</div>

            <h2>Excluir conta?</h2>

            <p>
              Essa ação não pode ser desfeita. Todos os seus dados, tarefas, registros de humor e sessões de foco
              serão apagados.
            </p>

            <input
              type="password"
              className="delete-senha"
              autoComplete="current-password"
              placeholder="Digite sua senha para confirmar"
              aria-label="Senha"
              required
              value={senhaExclusao}
              onChange={(e) => setSenhaExclusao(e.target.value)}
            />

            {mensagemExcluir && <span className="delete-message">{mensagemExcluir}</span>}

            <div className="delete-actions">
              <button type="button" className="cancel-delete-btn" onClick={() => setModalExcluir(false)}>
                Cancelar
              </button>
              <button type="submit" className="confirm-delete-btn">
                Sim, excluir
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}

export default Configuracoes;
