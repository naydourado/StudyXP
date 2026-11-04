import { useState } from "react";
import { Link } from "react-router-dom";

import api, { mensagemDeErro } from "../../services/api";
import Logo from "../../assets/StudyXP.webp";
import "../../components/AuthCard/AuthCard.css";

function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setEnviando(true);

    try {
      const resposta = await api.post("/auth/esqueci-senha", { email }, { _semRenovar: true });
      setMensagem(resposta.data.mensagem);
    } catch (error) {
      setErro(mensagemDeErro(error, "Não foi possível enviar agora. Tente de novo em alguns minutos."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <img className="logo" src={Logo} alt="Logo StudyXP" />

        <h2>Esqueci minha senha</h2>
        <p className="subtitle">Enviaremos um link para você criar uma senha nova.</p>

        {mensagem ? (
          <p className="success-message" role="status">
            {mensagem}
          </p>
        ) : (
          <form onSubmit={enviar}>
            <label htmlFor="esqueci-email">E-mail</label>
            <input
              id="esqueci-email"
              type="email"
              autoComplete="email"
              placeholder="Insira seu e-mail"
              required
              aria-describedby="esqueci-ajuda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p id="esqueci-ajuda" className="aviso-dados">
              Usamos o e-mail só para enviar o link, que vale por 30 minutos.
            </p>

            {erro && (
              <span className="error-message" role="alert">
                {erro}
              </span>
            )}

            <button type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}

        <p className="auth-link">
          Lembrou? <Link to="/">Entrar</Link>
        </p>
      </section>
    </main>
  );
}

export default EsqueciSenha;
