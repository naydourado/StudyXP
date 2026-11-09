import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import AceiteTermos from "../AceiteTermos/AceiteTermos";

// telas que exigem login; sem sessao, volta para o login
function RotaPrivada() {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return <p className="carregando-pagina">Carregando...</p>;
  }

  if (!usuario) {
    return <Navigate to="/" replace state={{ de: location.pathname }} />;
  }

  // termos ou politica mudaram desde o ultimo aceite: confirma antes de continuar
  if (usuario.termos_pendentes) {
    return <AceiteTermos />;
  }

  return <Outlet />;
}

export default RotaPrivada;
