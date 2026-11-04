import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { mensagemDeErro } from "../../services/api";
import Logo from "../../assets/StudyXP.webp";
import "../../components/AuthCard/AuthCard.css";

const SENHA_MINIMA = 8;

function Cadastro() {
  const navigate = useNavigate();
  const { cadastrar } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [maiorDeIdade, setMaiorDeIdade] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");

    if (senha.length < SENHA_MINIMA) {
      setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
      return;
    }
    if (!aceiteTermos || !maiorDeIdade) {
      setErro("Marque as duas confirmações para criar a conta.");
      return;
    }

    setEnviando(true);
    try {
      await cadastrar({
        nome,
        email,
        senha,
        aceite_termos: aceiteTermos,
        maior_de_idade: maiorDeIdade,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErro(mensagemDeErro(error, "Erro ao cadastrar. Verifique os dados."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <img className="logo" src={Logo} alt="Logo StudyXP" />

        <h2>Criar Conta</h2>
        <p className="subtitle">Transforme seus estudos em XP.</p>

        <form onSubmit={enviar}>
          <label htmlFor="cad-nome">Nome ou apelido</label>
          <input
            id="cad-nome"
            type="text"
            autoComplete="name"
            placeholder="Como quer ser chamado(a)"
            required
            minLength={2}
            maxLength={100}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <label htmlFor="cad-email">E-mail</label>
          <input
            id="cad-email"
            type="email"
            autoComplete="email"
            placeholder="Insira seu e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="cad-senha">Senha</label>
          <input
            id="cad-senha"
            type="password"
            autoComplete="new-password"
            placeholder={`Mínimo de ${SENHA_MINIMA} caracteres`}
            required
            minLength={SENHA_MINIMA}
            maxLength={128}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <label className="auth-check">
            <input type="checkbox" checked={aceiteTermos} onChange={(e) => setAceiteTermos(e.target.checked)} />
            <span>
              Li e aceito os{" "}
              <Link to="/termos" target="_blank" rel="noopener">
                Termos de Uso
              </Link>{" "}
              e estou ciente da{" "}
              <Link to="/privacidade" target="_blank" rel="noopener">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>

          <label className="auth-check">
            <input type="checkbox" checked={maiorDeIdade} onChange={(e) => setMaiorDeIdade(e.target.checked)} />
            <span>Tenho 18 anos ou mais.</span>
          </label>

          <p className="aviso-dados">
            Pedimos só o necessário: nome ou apelido para a saudação, e-mail para entrar e receber avisos da conta e a
            senha, que guardamos criptografada. Não pedimos CPF, telefone nem localização.
          </p>

          {erro && (
            <span className="error-message" role="alert">
              {erro}
            </span>
          )}

          <button type="submit" disabled={enviando}>
            {enviando ? "Criando conta..." : "Cadastrar"}
          </button>
        </form>

        <p className="auth-link">
          Já tem conta? <Link to="/">Entrar</Link>
        </p>
      </section>
    </main>
  );
}

export default Cadastro;
