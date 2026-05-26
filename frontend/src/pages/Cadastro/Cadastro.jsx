import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Logo from "../../assets/StudyXP.png";
import "../../components/AuthCard/AuthCard.css";

function Cadastro() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function cadastrar(e) {
    e.preventDefault();
    setErro("");

    try {
      await api.post("/usuarios", {
        nome,
        email,
        senha,
      });

      setSucesso("Conta criada com sucesso!");
      setErro("");

      // espera 2 segundos e vai pro login
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.log(error.response?.data || error);
      setErro("Erro ao cadastrar. Verifique os dados.");
      setSucesso("");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <img className="logo" src={Logo} alt="Logo StudyXP" />

        <h2>Criar Conta</h2>
        <p className="subtitle">Transforme seus estudos em XP.</p>

        <form onSubmit={cadastrar}>
          <label>Nome</label>
          <input
            type="text"
            placeholder="Insira seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

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

          {erro && (
            <span className="error-message">
              {erro}
            </span>
          )}

          {sucesso && (
            <span className="success-message">
              {sucesso}
            </span>
          )}

          <button type="submit">Cadastrar</button>
        </form>

        <p className="auth-link">
          Já tem conta? <Link to="/">Entrar</Link>
        </p>
      </section>
    </main>
  );
}

export default Cadastro;