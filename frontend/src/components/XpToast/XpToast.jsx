import { useEffect } from "react";

import "./XpToast.css";

// aviso flutuante de "+xp" e conquistas novas apos concluir algo
// resultado = resposta da api com { xp_ganho, novas_conquistas }
function XpToast({ resultado, aoFechar }) {
  useEffect(() => {
    if (!resultado) return undefined;
    const timer = setTimeout(aoFechar, 3500);
    return () => clearTimeout(timer);
  }, [resultado, aoFechar]);

  if (!resultado || (resultado.xp_ganho === 0 && resultado.novas_conquistas.length === 0)) {
    return null;
  }

  return (
    <div className="xp-toast" role="status" aria-live="polite">
      {resultado.xp_ganho !== 0 && (
        <strong className={resultado.xp_ganho > 0 ? "ganho" : "perda"}>
          {resultado.xp_ganho > 0 ? "+" : ""}
          {resultado.xp_ganho} XP
        </strong>
      )}

      {resultado.novas_conquistas.map((conquista) => (
        <span key={conquista.codigo}>Conquista desbloqueada: {conquista.nome}</span>
      ))}
    </div>
  );
}

export default XpToast;
