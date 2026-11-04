import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { mensagemDeErro } from "../../services/api";
import Logo from "../../assets/StudyXP.webp";
import "../../components/AuthCard/AuthCard.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { entrar } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function fazerLogin(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);

    try {
      await entrar(email, senha);
      navigate(location.state?.de || "/dashboard", { replace: true });
    } catch (error) {
      setErro(mensagemDeErro(error, "E-mail ou senha inválidos."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <img className="logo" src={Logo} alt="Logo StudyXP" />

        <h2>Entrar</h2>
        <p className="subtitle">Continue sua jornada de XP.</p>

        <form onSubmit={fazerLogin}>
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="Insira seu e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="login-senha">Senha</label>
          <input
            id="login-senha"
            type="password"
            autoComplete="current-password"
            placeholder="Insira sua senha"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <Link to="/esqueci-senha" className="auth-esqueci">
            Esqueci minha senha
          </Link>

          {erro && (
            <span className="error-message" role="alert">
              {erro}
            </span>
          )}

          <button type="submit" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-link">
          Não tem conta? <Link to="/cadastro">Crie uma</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
