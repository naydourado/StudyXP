from datetime import datetime

from pydantic import BaseModel, ConfigDict


class Modelo(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Mensagem(Modelo):
    mensagem: str


class StatusGamificacao(Modelo):
    xp_total: int
    nivel: int
    xp_no_nivel: int
    xp_para_proximo: int
    percentual: float
    ofensiva_atual: int
    ofensiva_recorde: int


class ConquistaOut(Modelo):
    codigo: str
    nome: str
    descricao: str
    icone: str
    desbloqueada: bool = True
    desbloqueada_em: datetime | None = None


# devolvido pelas acoes que dao xp (concluir tarefa, finalizar foco, registrar humor)
# para o app mostrar o "+xp" e as conquistas novas
class ResultadoXP(Modelo):
    xp_ganho: int
    gamificacao: StatusGamificacao
    novas_conquistas: list[ConquistaOut]
