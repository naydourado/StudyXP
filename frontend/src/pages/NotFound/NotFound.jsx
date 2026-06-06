import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <div className="notfound-page">
      <h1>404</h1>

      <h2>Página não encontrada</h2>

      <p>
        A página que você tentou acessar não existe ou foi removida.
      </p>

      <Link to="/dashboard" className="back-home">
        Voltar ao Dashboard
      </Link>
    </div>
  );
}

export default NotFound;