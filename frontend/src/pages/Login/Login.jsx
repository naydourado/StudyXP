import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Logo from "../../assets/StudyXP.png";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  async function fazerLogin(e) {
    e.preventDefault();
    setErro("");

    try {
      const response = await api.post("/login", {
        email,
        senha,
      });

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("usuario", JSON.stringify(response.data.usuario));

      navigate("/dashboard");
    } catch {
      setErro("E-mail ou senha inválidos.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <img className="logo" src={Logo} alt="Logo StudyXP" />

        <h2>Entrar</h2>
        <p className="subtitle">Continue sua jornada de XP.</p>

        <form onSubmit={fazerLogin}>
          <label>E-mail</label>
          <input
            type="email"
            placeholder="Insira seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Senha</label>
          <input
            type="password"
            placeholder="Insira sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {erro && <span className="error-message">{erro}</span>}

          <button type="submit">Entrar</button>
        </form>

        <p className="auth-link">
          Não tem conta? <Link to="/cadastro">Crie uma</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;