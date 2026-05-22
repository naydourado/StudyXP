# esse é o arquivo que, utilizado pelo SQLAlchemy, 
# transforma Python, na tabela MySQL

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)
from datetime import datetime, UTC

# função do SQLAlchemy responsável por criar o vínculo entre os models
# importa relacionamento entre tabelas e cria navegação entre objetos
from sqlalchemy.orm import relationship

from datetime import datetime, UTC
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False) # obrigatório
    email = Column(String(120), unique=True, nullable=False)
    senha = Column(String(255), nullable=False)
    xp = Column(Integer, default=0) # começa em 0
    nivel = Column(Integer, default=1) # começa em 1
    ultimo_acesso = Column(DateTime, nullable=True)
    sequencia_dias = Column(Integer, default=0)
    
    data_criacao = Column(
        DateTime,
        default=lambda: datetime.now(UTC)
    )

    # relacionamento 1:n entre usuario e tarefas
    tarefas = relationship(
        "Tarefa",
        back_populates="usuario"
    )

    # relacionamento 1:n entre usuario e registros de humor
    registros_humor = relationship(
        "RegistroHumor",
        back_populates="usuario"
    )

    # relacionamento 1:n entre usuario e sessoes de foco
    sessoes_foco = relationship(
        "SessaoFoco",
        back_populates="usuario"
    )


class Tarefa(Base):
    __tablename__ = "tarefas"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(150), nullable=False)
    descricao = Column(String(255))
    prioridade = Column(String(20), default="media")
    status = Column(String(20), default="pendente")
    xp_recompensa = Column(Integer, default=10)
    data_criacao = Column(DateTime, default=lambda: datetime.now(UTC))

    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    usuario = relationship(
        "Usuario", 
        back_populates="tarefas"
    )

class RegistroHumor(Base):
    __tablename__ = "registros_humor"

    id = Column(Integer, primary_key=True, index=True)
    humor = Column(String(50), nullable=False)
    observacao = Column(String(255))
    data_registro = Column(DateTime, default=lambda: datetime.now(UTC))

    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    usuario = relationship(
        "Usuario", 
        back_populates="registros_humor"
    )

class SessaoFoco(Base):
    __tablename__ = "sessoes_foco"

    id = Column(Integer, primary_key=True, index=True)

    # tempo estudado em minutos
    tempo_minutos = Column(Integer, nullable=False)

    data_sessao = Column(
        DateTime,
        default=lambda: datetime.now(UTC)
    )

    # fk do usuario dono da sessao
    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False
    )

    usuario = relationship(
        "Usuario",
        back_populates="sessoes_foco"
    )
    