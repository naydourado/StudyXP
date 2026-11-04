import { useEffect, useState } from "react";
import { LuTrophy, LuClock, LuCircleCheck } from "react-icons/lu";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api, { mensagemDeErro } from "../../services/api";
import Layout from "../../components/Layout/Layout";
import NivelCard from "../../components/NivelCard/NivelCard";
import "./Progresso.css";

const COR_PRINCIPAL = "#4f6ef7";

function rotuloDia(item) {
  return item.dia_semana.charAt(0).toUpperCase() + item.dia_semana.slice(1);
}

function Progresso() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api
      .get("/progresso", { params: { periodo: "semana" } })
      .then((resposta) => setDados(resposta.data))
      .catch((error) => setErro(mensagemDeErro(error, "Não foi possível carregar o progresso.")));
  }, []);

  if (!dados) {
    return (
      <Layout>
        <p className="carregando-pagina">{erro || "Carregando..."}</p>
      </Layout>
    );
  }

  const serie = dados.serie.map((item) => ({ ...item, dia: rotuloDia(item) }));
  const horasFocadas = Math.floor(dados.totais.minutos_foco / 60);

  return (
    <Layout>
      <section className="progresso-page">
        <header className="progresso-header">
          <div>
            <h1>Progresso</h1>
            <p>Veja sua evolução nos estudos.</p>
          </div>

          <NivelCard gamificacao={dados.gamificacao} />
        </header>

        <section className="progresso-grid">
          <div className="progress-card">
            <LuTrophy className="icone-trofeu" />
            <div>
              <strong>{dados.totais.xp_total.toLocaleString("pt-BR")}</strong>
              <span>XP Total</span>
            </div>
          </div>

          <div className="progress-card">
            <LuClock />
            <div>
              <strong>{horasFocadas}h</strong>
              <span>Horas focadas</span>
            </div>
          </div>

          <div className="progress-card">
            <LuCircleCheck />
            <div>
              <strong>{dados.totais.tarefas_concluidas}</strong>
              <span>Tarefas concluídas</span>
            </div>
          </div>
        </section>

        <section className="graficos-grid">
          <div className="grafico-card">
            <h2>XP da semana</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={serie} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#eef0f4" vertical={false} />
                <XAxis dataKey="dia" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip formatter={(valor) => [`${valor} XP`, "XP"]} labelFormatter={(dia) => dia} />
                <Line
                  type="monotone"
                  dataKey="xp"
                  stroke={COR_PRINCIPAL}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: COR_PRINCIPAL }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico-card">
            <h2>Tarefas por dia</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={serie} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#eef0f4" vertical={false} />
                <XAxis dataKey="dia" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip formatter={(valor) => [valor, "Tarefas"]} cursor={{ fill: "#f2f4ff" }} />
                <Bar dataKey="tarefas_concluidas" fill={COR_PRINCIPAL} radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </section>
    </Layout>
  );
}

export default Progresso;
