import { useState } from "react";
import { Link } from "react-router-dom";

import api, { mensagemDeErro } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import conteudo from "../../legal/conteudo.json";
import "./AceiteTermos.css";

// aparece no lugar das telas logadas quando os termos ou a politica mudaram desde o ultimo aceite
function AceiteTermos() {
  const { setUsuario, sair } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function aceitar() {
    setEnviando(true);
    setErro("");
    try {
      const resposta = await api.post("/me/aceitar-termos");
      setUsuario(resposta.data);
    } catch (error) {
      setErro(mensagemDeErro(error));
      setEnviando(false);
    }
  }

  return (
    <main className="aceite-termos">
      <section className="aceite-card" aria-labelledby="titulo-aceite">
        <h1 id="titulo-aceite">Atualizamos nossos termos</h1>
        <p>
          Os Termos de Uso e a Política de Privacidade mudaram (versão {conteudo.versao}). Leia e confirme para
          continuar usando o StudyXP.
        </p>
        <ul>
          <li>
            <Link to="/termos" target="_blank" rel="noopener">
              Termos de Uso
            </Link>
          </li>
          <li>
            <Link to="/privacidade" target="_blank" rel="noopener">
              Política de Privacidade
            </Link>
          </li>
        </ul>
        <p className="aceite-nota">
          Se não concordar, você pode sair agora ou excluir a conta em Configurações depois de aceitar.
        </p>

        {erro && (
          <p className="error-message" role="alert">
            {erro}
          </p>
        )}

        <div className="aceite-acoes">
          <button type="button" className="aceite-sair" onClick={sair}>
            Sair
          </button>
          <button type="button" className="aceite-ok" onClick={aceitar} disabled={enviando}>
            Li e aceito
          </button>
        </div>
      </section>
    </main>
  );
}

export default AceiteTermos;
