from datetime import date, datetime
from typing import Annotated

from pydantic import Field, StringConstraints

from app.models.enums import Humor, Prioridade, StatusSessao, StatusTarefa, TipoSessao
from app.schemas.comum import Modelo, ResultadoXP

Titulo = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
Descricao = Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000)]


# xp e status nao entram aqui: so o servidor muda (evita "mass assignment")
class TarefaCreate(Modelo):
    titulo: Titulo
    descricao: Descricao | None = None
    prioridade: Prioridade = Prioridade.MEDIA
    data_prazo: date | None = None


class TarefaUpdate(Modelo):
    titulo: Titulo | None = None
    descricao: Descricao | None = None
    prioridade: Prioridade | None = None
    data_prazo: date | None = None


class TarefaOut(Modelo):
    id: int
    titulo: str
    descricao: str | None
    prioridade: Prioridade
    status: StatusTarefa
    data_prazo: date | None
    xp_recompensa: int
    xp_concedido: int
    data_conclusao: datetime | None
    criado_em: datetime


class TarefaComXP(ResultadoXP):
    tarefa: TarefaOut


class SessaoCreate(Modelo):
    tipo: TipoSessao = TipoSessao.FOCO
    duracao_planejada: int = Field(ge=1, le=180, description="minutos")


class SessaoOut(Modelo):
    id: int
    tipo: TipoSessao
    duracao_planejada: int
    status: StatusSessao
    iniciada_em: datetime
    finalizada_em: datetime | None
    minutos_validos: int
    xp_concedido: int


class SessaoComXP(ResultadoXP):
    sessao: SessaoOut


class ResumoFocoHoje(Modelo):
    minutos_foco: int
    sessoes_concluidas: int


class HumorCreate(Modelo):
    humor: Humor
    observacao: Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)] | None = None


class HumorOut(Modelo):
    id: int
    humor: Humor
    observacao: str | None
    criado_em: datetime


class HumorComXP(ResultadoXP):
    registro: HumorOut
