import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuSquareCheckBig,
  LuTrendingUp,
  LuSmile,
  LuTimer,
  LuUser,
  LuSettings,
  LuLogOut,
} from "react-icons/lu";

import Logo from "../../assets/StudyXP.png"
import LogoXP from "../../assets/XP.png";
import "./Layout.css";

function Layout({ children }) {
  const navigate = useNavigate();

  const [sidebarFechada, setSidebarFechada] = useState(
    window.innerWidth <= 900
  );

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LuLayoutDashboard /> },
    { path: "/tarefas", label: "Tarefas", icon: <LuSquareCheckBig /> },
    { path: "/progresso", label: "Progresso", icon: <LuTrendingUp /> },
    { path: "/humor", label: "Registro de Humor", icon: <LuSmile /> },
    { path: "/foco", label: "Temporizador de Foco", icon: <LuTimer /> },
    { path: "/perfil", label: "Perfil", icon: <LuUser /> },
    { path: "/configuracoes", label: "Configurações", icon: <LuSettings /> },
  ];

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  }

  function alternarSidebar() {
    setSidebarFechada(!sidebarFechada);
  }

  // recolhe sidebar automaticamente em telas menores
  useEffect(() => {
    function verificarTamanho() {
      if (window.innerWidth <= 900) {
        setSidebarFechada(true);
      } else {
        setSidebarFechada(false);
      }
    }

    window.addEventListener(
      "resize",
      verificarTamanho
    );

    return () =>
      window.removeEventListener(
        "resize",
        verificarTamanho
      );
  }, []);

  return (
    <main className={sidebarFechada ? "app-layout sidebar-closed" : "app-layout"}>
      <aside className="sidebar">
        <div>
          <button className="logo-button" onClick={alternarSidebar}>
            {sidebarFechada ? <img src={LogoXP} alt="Logo StudyXP" /> : <img src={Logo} alt="Logo StudyXP" />}
          </button>

          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <NavLink key={item.path} to={item.path} title={item.label}>
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <button className="logout-btn" onClick={sair} title="Sair">
          <LuLogOut />
          <span>Sair</span>
        </button>
      </aside>

      <section className="content">{children}</section>
    </main>
  );
}

export default Layout;