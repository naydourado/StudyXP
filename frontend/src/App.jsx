import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import RotaPrivada from "./components/RotaPrivada/RotaPrivada";
import AvisoCookies from "./components/AvisoCookies/AvisoCookies";
import Login from "./pages/Login/Login";
import Cadastro from "./pages/Cadastro/Cadastro";
import Dashboard from "./pages/Dashboard/Dashboard";
import Tarefas from "./pages/Tarefas/Tarefas";
import Foco from "./pages/Foco/Foco";
import Humor from "./pages/Humor/Humor";
import Perfil from "./pages/Perfil/Perfil";
import Configuracoes from "./pages/Configuracoes/Configuracoes";
import { Privacidade, Termos } from "./pages/Legal/Legal";
import EsqueciSenha from "./pages/Senha/EsqueciSenha";
import RedefinirSenha from "./pages/Senha/RedefinirSenha";
import NotFound from "./pages/NotFound/NotFound";

// a tela de progresso traz a biblioteca de graficos: carregada so quando aberta
const Progresso = lazy(() => import("./pages/Progresso/Progresso"));

// quem ja esta logado nao precisa ver login/cadastro
function SomenteVisitante({ children }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return null;
  return usuario ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SomenteVisitante><Login /></SomenteVisitante>} />
          <Route path="/cadastro" element={<SomenteVisitante><Cadastro /></SomenteVisitante>} />
          <Route path="/esqueci-senha" element={<SomenteVisitante><EsqueciSenha /></SomenteVisitante>} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />

          <Route element={<RotaPrivada />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tarefas" element={<Tarefas />} />
            <Route
              path="/progresso"
              element={
                <Suspense fallback={<p className="carregando-pagina">Carregando...</p>}>
                  <Progresso />
                </Suspense>
              }
            />
            <Route path="/foco" element={<Foco />} />
            <Route path="/humor" element={<Humor />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <AvisoCookies />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
