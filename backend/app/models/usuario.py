from datetime import date, datetime

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import get_settings
from app.core.database import Base
from app.models.tipos import coluna_atualizado_em, coluna_criado_em


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255))
    bio: Mapped[str | None] = mapped_column(String(280))
    fuso_horario: Mapped[str] = mapped_column(String(50), default="America/Sao_Paulo")

    # o nivel nao e salvo: e sempre calculado a partir do xp (services/gamificacao.py)
    xp: Mapped[int] = mapped_column(default=0)
    ofensiva_atual: Mapped[int] = mapped_column(default=0)
    ofensiva_recorde: Mapped[int] = mapped_column(default=0)
    ultimo_dia_ativo: Mapped[date | None]

    termos_versao: Mapped[str] = mapped_column(String(20))
    termos_aceitos_em: Mapped[datetime]

    criado_em: Mapped[datetime] = coluna_criado_em()
    atualizado_em: Mapped[datetime] = coluna_atualizado_em()

    @property
    def termos_pendentes(self) -> bool:
        return self.termos_versao != get_settings().termos_versao

    # cascade no orm + ondelete cascade no banco: excluir a conta apaga tudo
    tarefas = relationship("Tarefa", back_populates="usuario", cascade="all, delete-orphan", passive_deletes=True)
    registros_humor = relationship("RegistroHumor", cascade="all, delete-orphan", passive_deletes=True)
    sessoes_foco = relationship("SessaoFoco", cascade="all, delete-orphan", passive_deletes=True)
    eventos_xp = relationship("EventoXP", cascade="all, delete-orphan", passive_deletes=True)
    conquistas = relationship("UsuarioConquista", cascade="all, delete-orphan", passive_deletes=True)
    preferencias = relationship("Preferencias", uselist=False, cascade="all, delete-orphan", passive_deletes=True)
    refresh_tokens = relationship("RefreshToken", cascade="all, delete-orphan", passive_deletes=True)
    consentimentos = relationship("Consentimento", cascade="all, delete-orphan", passive_deletes=True)
    acessos = relationship("HistoricoAcesso", cascade="all, delete-orphan", passive_deletes=True)
    tokens_redefinicao = relationship("TokenRedefinicaoSenha", cascade="all, delete-orphan", passive_deletes=True)
    dispositivos = relationship("DispositivoPush", cascade="all, delete-orphan", passive_deletes=True)
