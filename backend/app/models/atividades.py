# tarefas, sessoes de foco e registros de humor do usuario
from datetime import date, datetime

from sqlalchemy import Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import Humor, Prioridade, StatusSessao, StatusTarefa, TipoSessao
from app.models.tipos import coluna_atualizado_em, coluna_criado_em, coluna_enum, fk_usuario


class Tarefa(Base):
    __tablename__ = "tarefas"
    __table_args__ = (Index("ix_tarefas_usuario_status", "usuario_id", "status"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = fk_usuario()
    titulo: Mapped[str] = mapped_column(String(150))
    descricao: Mapped[str | None] = mapped_column(String(1000))
    prioridade: Mapped[Prioridade] = coluna_enum(Prioridade, default=Prioridade.MEDIA)
    status: Mapped[StatusTarefa] = coluna_enum(StatusTarefa, default=StatusTarefa.PENDENTE)
    data_prazo: Mapped[date | None]

    # xp que a tarefa vale (definido pela prioridade) e xp que de fato foi concedido
    xp_recompensa: Mapped[int] = mapped_column(default=0)
    xp_concedido: Mapped[int] = mapped_column(default=0)
    data_conclusao: Mapped[datetime | None]

    # controle dos lembretes push (vespera do prazo e no dia), para nao repetir
    lembrete_vespera_em: Mapped[datetime | None]
    lembrete_dia_em: Mapped[datetime | None]

    criado_em: Mapped[datetime] = coluna_criado_em()
    atualizado_em: Mapped[datetime] = coluna_atualizado_em()

    usuario = relationship("Usuario", back_populates="tarefas")


class SessaoFoco(Base):
    __tablename__ = "sessoes_foco"
    __table_args__ = (Index("ix_sessoes_foco_usuario_inicio", "usuario_id", "iniciada_em"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = fk_usuario()
    tipo: Mapped[TipoSessao] = coluna_enum(TipoSessao, default=TipoSessao.FOCO)
    duracao_planejada: Mapped[int]
    status: Mapped[StatusSessao] = coluna_enum(StatusSessao, default=StatusSessao.EM_ANDAMENTO)

    # o horario de inicio e marcado pelo servidor, nao pelo app
    iniciada_em: Mapped[datetime]
    finalizada_em: Mapped[datetime | None]
    minutos_validos: Mapped[int] = mapped_column(default=0)
    xp_concedido: Mapped[int] = mapped_column(default=0)


class RegistroHumor(Base):
    __tablename__ = "registros_humor"
    __table_args__ = (Index("ix_registros_humor_usuario_criado", "usuario_id", "criado_em"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = fk_usuario()
    humor: Mapped[Humor] = coluna_enum(Humor)

    # dado sensivel (lgpd): guardado criptografado
    observacao_cifrada: Mapped[str | None] = mapped_column(Text)
    criado_em: Mapped[datetime] = coluna_criado_em()
