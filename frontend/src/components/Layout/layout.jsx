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

import "./Layout.css";

function Layout({ children }) {
  const navigate = useNavigate();

  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <LuLayoutDashboard />,
    },
    {
      path: "/tarefas",
      label: "Tarefas",
      icon: <LuSquareCheckBig />,
    },
    {
      path: "/progresso",
      label: "Progresso",
      icon: <LuTrendingUp />,
    },
    {
      path: "/humor",
      label: "Registro de Humor",
      icon: <LuSmile />,
    },
    {
      path: "/foco",
      label: "Temporizador de Foco",
      icon: <LuTimer />,
    },
    {
      path: "/perfil",
      label: "Perfil",
      icon: <LuUser />,
    },
    {
      path: "/configuracoes",
      label: "Configurações",
      icon: <LuSettings />,
    },
  ];

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  }

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div>
          <h1 className="sidebar-logo">STUDYXP</h1>

          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <NavLink key={item.path} to={item.path}>
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <button className="logout-btn" onClick={sair}>
          <LuLogOut />
          <span>Sair</span>
        </button>
      </aside>

      <section className="content">{children}</section>
    </main>
  );
}

export default Layout;