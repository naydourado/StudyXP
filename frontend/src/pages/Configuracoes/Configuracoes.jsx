import { useEffect, useState } from "react";
import { LuBell, LuShieldAlert } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import Layout from "../../components/Layout/Layout";
import "./Configuracoes.css";

function Configuracoes() {
  const [dashboard, setDashboard] = useState(null);

  const [lembretesTarefas, setLembretesTarefas] = useState(true);
  const [pausaPomodoro, setPausaPomodoro] = useState(true);
  const [resumoSemanal, setResumoSemanal] = useState(true);

  const navigate = useNavigate();
  const [modalExcluir, setModalExcluir] = useState(false);
  const [mensagemExcluir, setMensagemExcluir] = useState("");
  const xpAtual = dashboard?.xp || 0;
  const nivel = dashboard?.nivel || 1;
  const xpProximoNivel = nivel * 100;
  const progressoXp = Math.min((xpAtual / xpProximoNivel) * 100, 100);
  const [abrirSenha, setAbrirSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [mensagemSenha, setMensagemSenha] = useState("");


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

  async function alterarSenha() {
    try {
      await api.put("/alterar-senha", {
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
      });

      setMensagemSenha(
        "Senha alterada com sucesso!"
      );

      setSenhaAtual("");
      setNovaSenha("");

      setTimeout(() => {
        setAbrirSenha(false);
        setMensagemSenha("");
      }, 1500);

    } catch (error) {
      console.log(error.response?.data || error);

      setMensagemSenha(
        error.response?.data?.detail ||
        "Erro ao alterar senha."
      );
    }
  }

  async function excluirConta() {
    try {
      await api.delete("/perfil");

      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      navigate("/");
    } catch (error) {
      console.log(error.response?.data || error);
      setMensagemExcluir("Erro ao excluir conta.");
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
            <button
              className="password-btn"
              onClick={() => setAbrirSenha(true)}
            >
              Alterar senha
            </button>

            <button
              className="delete-account-btn"
              onClick={() => setModalExcluir(true)}
            >
              Excluir conta
            </button>
          </div>

          {
            abrirSenha && (
              <div className="senha-modal">
                <div className="senha-box">
                  <h3>Alterar senha</h3>

                  <input
                    type="password"
                    placeholder="Senha atual"
                    value={senhaAtual}
                    onChange={(e) =>
                      setSenhaAtual(e.target.value)
                    }
                  />

                  <input
                    type="password"
                    placeholder="Nova senha"
                    value={novaSenha}
                    onChange={(e) =>
                      setNovaSenha(e.target.value)
                    }
                  />

                  {mensagemSenha && (
                    <p>{mensagemSenha}</p>
                  )}

                  <div className="senha-actions">
                    <button
                      className="cancel-btn"
                      onClick={() =>
                        setAbrirSenha(false)
                      }
                    >
                      Cancelar
                    </button>

                    <button
                      className="save-btn"
                      onClick={alterarSenha}
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            )
          }
        </section>
      </section>

      {modalExcluir && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-icon">
              !
            </div>

            <h2>Excluir conta?</h2>

            <p>
              Essa ação não poderá ser desfeita. Todos os seus dados,
              tarefas, registros de humor e sessões de foco serão removidos.
            </p>

            {mensagemExcluir && (
              <span className="delete-message">
                {mensagemExcluir}
              </span>
            )}

            <div className="delete-actions">
              <button
                className="cancel-delete-btn"
                onClick={() => setModalExcluir(false)}
              >
                Cancelar
              </button>

              <button
                className="confirm-delete-btn"
                onClick={excluirConta}
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Configuracoes;