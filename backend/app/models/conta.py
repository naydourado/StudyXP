# dados de conta: gamificacao, preferencias, sessoes de login, consentimentos e acessos
from datetime import date, datetime

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import OrigemXP, TipoConsentimento
from app.models.tipos import coluna_criado_em, coluna_enum, fk_usuario


# extrato de xp: cada ganho ou estorno vira uma linha
class EventoXP(Base):
    __tablename__ = "eventos_xp"
    __table_args__ = (Index("ix_eventos_xp_usuario_criado", "usuario_id", "criado_em"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = fk_usuario()
    origem: Mapped[OrigemXP] = coluna_enum(OrigemXP)
    origem_id: Mapped[int | None]
    xp: Mapped[int]
    criado_em: Mapped[datetime] = coluna_criado_em()


# o catalogo de conquistas fica no codigo (services/conquistas.py); aqui so o desbloqueio
class UsuarioConquista(Base):
    __tablename__ = "usuario_conquistas"
    __table_args__ = (UniqueConstraint("usuario_id", "codigo", name="uq_usuario_conquista"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = fk_usuario()
    codigo: Mapped[str] = mapped_column(String(40))
    desbloqueada_em: Mapped[datetime] = coluna_criado_em()


class Preferencias(Base):
    __tablename__ = "preferencias"

    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    lembrete_tarefas: Mapped[bool] = mapped_column(default=True)
    som_pomodoro: Mapped[bool] = mapped_column(default=True)
    # e-mail semanal e opt-in
    resumo_semanal: Mapped[bool] = mapped_column(default=False)
    # data (local) do ultimo resumo enviado, para nao mandar duas vezes na mesma semana
    resumo_enviado_em: Mapped[date | None]


# o token em si nunca e salvo, apenas o hash sha-256
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = fk_usuario()
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    # tokens gerados pela mesma sessao de login; se um token velho for reutilizado,
    # a familia inteira e revogada (sinal de roubo)
    familia: Mapped[str] = mapped_column(String(36), index=True)
    expira_em: Mapped[datetime]
    revogado_em: Mapped[datetime | None]
    dispositivo: Mapped[str | None] = mapped_column(String(200))
    criado_em: Mapped[datetime] = coluna_criado_em()


# historico de aceites e revogacoes (prova de consentimento - lgpd art. 8)
class Consentimento(Base):
    __tablename__ = "consentimentos"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = fk_usuario()
    tipo: Mapped[TipoConsentimento] = coluna_enum(TipoConsentimento)
    versao: Mapped[str] = mapped_column(String(20))
    concedido: Mapped[bool]
    criado_em: Mapped[datetime] = coluna_criado_em()


# log de seguranca dos logins (retencao de 6 meses)
class HistoricoAcesso(Base):
    __tablename__ = "historico_acessos"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = fk_usuario()
    ip: Mapped[str | None] = mapped_column(String(45))
    criado_em: Mapped[datetime] = coluna_criado_em()


# pedido de "esqueci minha senha": token de uso unico, valido por 30 minutos
class TokenRedefinicaoSenha(Base):
    __tablename__ = "tokens_redefinicao_senha"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = fk_usuario()
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expira_em: Mapped[datetime]
    usado_em: Mapped[datetime | None]
    criado_em: Mapped[datetime] = coluna_criado_em()


# celulares do usuario que recebem notificacoes push (token do expo push)
class DispositivoPush(Base):
    __tablename__ = "dispositivos_push"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = fk_usuario()
    token: Mapped[str] = mapped_column(String(200), unique=True)
    plataforma: Mapped[str] = mapped_column(String(20))
    criado_em: Mapped[datetime] = coluna_criado_em()
