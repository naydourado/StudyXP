import "./NivelCard.css";

// card de nivel/xp do topo das telas; os numeros vem prontos do servidor
// (gamificacao: { nivel, xp_no_nivel, xp_para_proximo, percentual })
function NivelCard({ gamificacao }) {
  if (!gamificacao) {
    return <div className="level-card level-card-vazio" aria-hidden="true" />;
  }

  return (
    <div className="level-card">
      <div className="level-info">
        <strong>Nível {gamificacao.nivel}</strong>
        <span>
          {gamificacao.xp_no_nivel} / {gamificacao.xp_para_proximo} XP
        </span>
      </div>

      <div
        className="level-bar"
        role="progressbar"
        aria-label="Progresso até o próximo nível"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={gamificacao.percentual}
      >
        <div className="level-progress" style={{ width: `${gamificacao.percentual}%` }} />
      </div>
    </div>
  );
}

export default NivelCard;
