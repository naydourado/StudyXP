import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Cadastro from "./pages/Cadastro/Cadastro";
import Dashboard from "./pages/Dashboard/Dashboard";
import Tarefas from "./pages/Tarefas/Tarefas";
import Progresso from "./pages/Progresso/Progresso";
import Foco from "./pages/Foco/Foco";
import Humor from "./pages/Humor/Humor";
import Perfil from "./pages/Perfil/Perfil";
import Configuracoes from "./pages/Configuracoes/Configuracoes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tarefas" element={<Tarefas />} />
        <Route path="/progresso" element={<Progresso />} />
        <Route path="/foco" element={<Foco />} />
        <Route path="/humor" element={<Humor />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;