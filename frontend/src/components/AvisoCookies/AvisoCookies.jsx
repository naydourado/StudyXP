import { useState } from "react";
import { Link } from "react-router-dom";

import "./AvisoCookies.css";

// o site so usa cookies essenciais (sessao), entao nao ha consentimento a pedir:
// este aviso apenas informa (transparencia - guia de cookies da anpd) e some depois de lido
const CHAVE = "studyxp_aviso_cookies";

function jaViu() {
  try {
    return window.localStorage.getItem(CHAVE) === "visto";
  } catch {
    // navegador bloqueando o armazenamento: mostra o aviso sem quebrar a pagina
    return false;
  }
}

function AvisoCookies() {
  const [visivel, setVisivel] = useState(() => !jaViu());

  if (!visivel) return null;

  function fechar() {
    try {
      window.localStorage.setItem(CHAVE, "visto");
    } catch {
      // sem armazenamento: o aviso volta na proxima visita
    }
    setVisivel(false);
  }

  return (
    <aside className="aviso-cookies" role="region" aria-label="Aviso sobre cookies">
      <p>
        Usamos apenas cookies <strong>essenciais</strong> para manter você conectado. Sem publicidade, sem
        rastreamento e sem ferramentas de análise. <Link to="/privacidade">Saiba mais</Link>
      </p>
      <button type="button" onClick={fechar}>
        Entendi
      </button>
    </aside>
  );
}

export default AvisoCookies;
