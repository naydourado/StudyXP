import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Cadastro from "./pages/Cadastro/Cadastro";
// import Dashboard from "./pages/Dashboard/Dashboard";
// import Tarefas from "./pages/Tarefas/Tarefas";
// import Foco from "./pages/Foco/Foco";
// import Humor from "./pages/Humor/Humor";
// import Perfil from "./pages/Perfil/Perfil";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        {/* <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tarefas" element={<Tarefas />} />
        <Route path="/foco" element={<Foco />} />
        <Route path="/humor" element={<Humor />} />
        <Route path="/perfil" element={<Perfil />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;