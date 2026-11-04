import { useEffect, useState } from "react";
import { LuFlame, LuClock, LuSquareCheck, LuTrophy, LuTarget, LuSmile, LuLock } from "react-icons/lu";

import api, { mensagemDeErro } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Layout from "../../components/Layout/Layout";
import NivelCard from "../../components/NivelCard/NivelCard";
import { formatarMinutos } from "../../constants/gamificacao";
import "./Perfil.css";

// icone e cor de cada conquista (o campo "icone" vem da api)
const ICONES = {
  trofeu: { icone: <LuTrophy />, cor: "blue" },
  fogo: { icone: <LuFlame />, cor: "orange" },
  alvo: { icone: <LuTarget />, cor: "blue" },
  relogio: { icone: <LuClock />, cor: "blue" },
  sorriso: { icone: <LuSmile />, cor: "orange" },
};

function Perfil() {
  const { setUsuario: atualizarUsuarioDaSessao } = useAuth();

  const [usuario, setUsuario] = useState(null);
  const [gamificacao, setGamificacao] = useState(null);
  const [conquistas, setConquistas] = useState([]);
  const [totais, setTotais] = useState(null);

  const [form, setForm] = useState({ nome: "", email: "", bio: "" });
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/me"), api.get("/conquistas"), api.get("/progresso")])
      .then(([respostaUsuario, respostaConquistas, respostaProgresso]) => {
        setUsuario(respostaUsuario.data);
        setForm({
          nome: respostaUsuario.data.nome,
          email: respostaUsuario.data.email,
          bio: respostaUsuario.data.bio || "",
        });
        setConquistas(respostaConquistas.data);
        setGamificacao(respostaProgresso.data.gamificacao);
        setTotais(respostaProgresso.data.totais);
      })
      .catch((error) => setErro(mensagemDeErro(error, "Não foi possível carregar o perfil.")));
  }, []);

  function alterarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvarPerfil(e) {
    e.preventDefault();
    setMensagem("");
    setErro("");
    setSalvando(true);

    try {
      const resposta = await api.patch("/me", {
        nome: form.nome.trim(),
        email: form.email.trim(),
        bio: form.bio.trim(),
      });
      setUsuario(resposta.data);
      atualizarUsuarioDaSessao(resposta.data);
      setMensagem("Alterações salvas!");
    } catch (error) {
      setErro(mensagemDeErro(error, "Erro ao salvar alterações."));
    } finally {
      setSalvando(false);
    }
  }

  if (!usuario || !gamificacao) {
    return (
      <Layout>
        <p className="carregando-pagina">{erro || "Carregando..."}</p>
      </Layout>
    );
  }

  const desbloqueadas = conquistas.filter((conquista) => conquista.desbloqueada).length;
  const xpRestante = gamificacao.xp_para_proximo - gamificacao.xp_no_nivel;

  return (
    <Layout>
      <section className="perfil-page">
        <header className="perfil-header">
          <div>
            <h1>Perfil</h1>
            <p>Suas informações e conquistas.</p>
          </div>

          <NivelCard gamificacao={gamificacao} />
        </header>

        <section className="perfil-top-grid">
          <div className="profile-summary-card">
            <div
              className="avatar-ring"
              style={{
                background: `conic-gradient(#4f7df3 ${gamificacao.percentual * 3.6}deg, #eef2ff 0deg)`,
              }}
            >
              <div className="avatar-circle">{usuario.nome.charAt(0).toUpperCase()}</div>
              <span>NÍVEL {gamificacao.nivel}</span>
            </div>

            <h2>{usuario.nome}</h2>
            <p>{usuario.email}</p>

            <div className="xp-box">
              <div className="xp-info">
                <span>NÍVEL ATUAL</span>
                <strong>{gamificacao.nivel}</strong>
              </div>
              <small>
                {xpRestante} XP para o nível {gamificacao.nivel + 1}
              </small>
            </div>
          </div>

          <div className="profile-info-card">
            <h2>Editar Informações</h2>

            <form onSubmit={salvarPerfil}>
              <div className="form-row">
                <label>
                  Nome
                  <input
                    value={form.nome}
                    maxLength={100}
                    required
                    onChange={(e) => alterarCampo("nome", e.target.value)}
                  />
                </label>

                <label>
                  E-mail
                  <input
                    type="email"
                    value={form.email}
                    required
                    onChange={(e) => alterarCampo("email", e.target.value)}
                  />
                </label>
              </div>

              <label className="bio-label">
                Bio
                <textarea
                  value={form.bio}
                  maxLength={280}
                  placeholder="Conte um pouco sobre você."
                  aria-describedby="bio-ajuda"
                  onChange={(e) => alterarCampo("bio", e.target.value)}
                />
                <small id="bio-ajuda" className="campo-ajuda">
                  Opcional e visível só para você. Evite informações sensíveis.
                </small>
              </label>

              {totais && (
                <div className="profile-stats">
                  <div>
                    <span className="stat-icon orange">
                      <LuFlame />
                    </span>
                    <p>Sequência</p>
                    <strong>{gamificacao.ofensiva_atual} dias</strong>
                  </div>

                  <div>
                    <span className="stat-icon blue">
                      <LuClock />
                    </span>
                    <p>Foco</p>
                    <strong>{formatarMinutos(totais.minutos_foco)}</strong>
                  </div>

                  <div>
                    <span className="stat-icon blue">
                      <LuSquareCheck />
                    </span>
                    <p>Tarefas</p>
                    <strong>{totais.tarefas_concluidas}</strong>
                  </div>
                </div>
              )}

              {mensagem && <p className="perfil-message">{mensagem}</p>}
              {erro && (
                <p className="error-message" role="alert">
                  {erro}
                </p>
              )}

              <button type="submit" disabled={salvando}>
                Salvar Alterações
              </button>
            </form>
          </div>
        </section>

        <section className="achievements-card">
          <div className="achievements-header">
            <h2>Conquistas</h2>
            <span>
              {desbloqueadas} de {conquistas.length} desbloqueadas
            </span>
          </div>

          <div className="achievements-grid">
            {conquistas.map((conquista) => {
              const visual = ICONES[conquista.icone] ?? ICONES.trofeu;
              return (
                <div
                  key={conquista.codigo}
                  className={
                    conquista.desbloqueada ? `achievement-item unlocked ${visual.cor}` : "achievement-item locked"
                  }
                  title={conquista.descricao}
                >
                  <div className="achievement-icon">{conquista.desbloqueada ? visual.icone : <LuLock />}</div>
                  <strong>{conquista.nome}</strong>
                  <p>{conquista.descricao}</p>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </Layout>
  );
}

export default Perfil;
