# esse é o arquivo que, utilizado pelo SQLAlchemy, 
# transforma Python, na tabela MySQL

from sqlalchemy import Column, Integer, String, DateTime
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
    
    data_criacao = Column(
        DateTime,
        default=lambda: datetime.now(UTC)
    )

    tarefas = relationship("Tarefa", back_populates="usuario")


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

    usuario = relationship("Usuario", back_populates="tarefas")