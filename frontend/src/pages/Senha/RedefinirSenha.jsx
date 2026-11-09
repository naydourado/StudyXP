import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import api, { mensagemDeErro } from "../../services/api";
import Logo from "../../assets/StudyXP.webp";
import "../../components/AuthCard/AuthCard.css";

const SENHA_MINIMA = 8;

// aberta pelo link do e-mail: /redefinir-senha?token=...
function RedefinirSenha() {
  const [parametros] = useSearchParams();
  const token = parametros.get("token") || "";

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [concluido, setConcluido] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");

    if (senha.length < SENHA_MINIMA) {
      setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
      return;
    }
    if (senha !== confirmacao) {
      setErro("As senhas não são iguais.");
      return;
    }

    setEnviando(true);
    try {
      await api.post("/auth/redefinir-senha", { token, nova_senha: senha }, { _semRenovar: true });
      setConcluido(true);
    } catch (error) {
      setErro(mensagemDeErro(error, "Link inválido ou expirado. Peça um novo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <img className="logo" src={Logo} alt="Logo StudyXP" />
        <h2>Nova senha</h2>

        {!token ? (
          <p className="error-message" role="alert">
            Link incompleto. <Link to="/esqueci-senha">Peça um novo link</Link>.
          </p>
        ) : concluido ? (
          <>
            <p className="success-message" role="status">
              Senha alterada! Agora é só entrar com a nova senha.
            </p>
            <p className="auth-link">
              <Link to="/">Ir para o login</Link>
            </p>
          </>
        ) : (
          <form onSubmit={enviar}>
            <label htmlFor="nova-senha">Nova senha</label>
            <input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              placeholder={`Mínimo de ${SENHA_MINIMA} caracteres`}
              required
              minLength={SENHA_MINIMA}
              maxLength={128}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />

            <label htmlFor="confirmar-senha">Repita a nova senha</label>
            <input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              required
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />

            {erro && (
              <span className="error-message" role="alert">
                {erro}
              </span>
            )}

            <button type="submit" disabled={enviando}>
              {enviando ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default RedefinirSenha;
