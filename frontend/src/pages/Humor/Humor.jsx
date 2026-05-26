import { useEffect, useState } from "react";
import {
    LuSmile,
    LuMeh,
    LuFrown,
    LuCloudRain,
    LuZap,
} from "react-icons/lu";

import api from "../../services/api";
import Layout from "../../components/Layout/Layout";
import "./Humor.css";

function Humor() {
    const [humorSelecionado, setHumorSelecionado] = useState("");
    const [observacao, setObservacao] = useState("");
    const [registros, setRegistros] = useState([]);
    const [mensagem, setMensagem] = useState("");

    const humores = [
        { nome: "Feliz", valor: "feliz", emoji: "😊" },
        { nome: "Normal", valor: "normal", emoji: "🙂" },
        { nome: "Cansado", valor: "cansado", emoji: "🥱" },
        { nome: "Ansioso", valor: "ansioso", emoji: "😟" },
        { nome: "Triste", valor: "triste", emoji: "☹️" },
    ];

    async function carregarHumores() {
        try {
            const response = await api.get("/humor");
            setRegistros(response.data);
        } catch (error) {
            console.log(error.response?.data || error);
        }
    }

    useEffect(() => {
        carregarHumores();
    }, []);

    async function registrarHumor(e) {
        e.preventDefault();

        if (!humorSelecionado) {
            setMensagem("Selecione um humor.");
            return;
        }

        try {
            await api.post("/humor", {
                humor: humorSelecionado,
                observacao,
            });

            setHumorSelecionado("");
            setObservacao("");
            setMensagem("Humor registrado com sucesso!");

            carregarHumores();
        } catch (error) {
            console.log(error.response?.data || error);
            setMensagem("Erro ao registrar humor.");
        }
    }

    return (
        <Layout>
            <section className="humor-page">
                <header className="humor-header">
                    <div>
                        <h1>Registro de Humor</h1>
                        <p>Registre como você está se sentindo durante os estudos.</p>
                    </div>
                </header>

                <section className="humor-content">
                    <div className="humor-card">
                        <div className="card-title">
                            <LuSmile />
                            <h2>Como você está hoje?</h2>
                        </div>

                        <form onSubmit={registrarHumor}>
                            <div className="humor-options">
                                {humores.map((humor) => (
                                    <button
                                        key={humor.valor}
                                        type="button"
                                        title={humor.nome}
                                        className={
                                            humorSelecionado === humor.valor
                                                ? "humor-option active"
                                                : "humor-option"
                                        }
                                        onClick={() => setHumorSelecionado(humor.valor)}
                                    >
                                        <span>{humor.emoji}</span>
                                    </button>
                                ))}
                            </div>

                            <label>Observação</label>

                            <textarea
                                placeholder="Escreva algo sobre seu dia de estudos..."
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                            />

                            {mensagem && <p className="humor-message">{mensagem}</p>}

                            <button className="save-humor-btn" type="submit">
                                Registrar humor
                            </button>
                        </form>
                    </div>

                    <div className="historico-card">
                        <h2>Histórico</h2>

                        {registros.length > 0 ? (
                            registros
                                .slice()
                                .reverse()
                                .map((registro) => (
                                    <div className="historico-item" key={registro.id}>
                                        <div>
                                            <strong>
                                                {registro.humor.charAt(0).toUpperCase() +
                                                    registro.humor.slice(1)}
                                            </strong>

                                            <span>
                                                {new Date(registro.data_registro).toLocaleDateString(
                                                    "pt-BR"
                                                )}
                                            </span>
                                        </div>

                                        <p>{registro.observacao || "Sem observação."}</p>
                                    </div>
                                ))
                        ) : (
                            <p className="empty-text">Nenhum humor registrado ainda.</p>
                        )}
                    </div>
                </section>
            </section>
        </Layout>
    );
}

export default Humor;