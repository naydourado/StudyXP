# importa todos os models para o sqlalchemy e o alembic enxergarem as tabelas
from app.models.atividades import RegistroHumor, SessaoFoco, Tarefa
from app.models.conta import (
    Consentimento,
    DispositivoPush,
    EventoXP,
    HistoricoAcesso,
    Preferencias,
    RefreshToken,
    TokenRedefinicaoSenha,
    UsuarioConquista,
)
from app.models.usuario import Usuario

__all__ = [
    "Usuario",
    "Tarefa",
    "SessaoFoco",
    "RegistroHumor",
    "EventoXP",
    "UsuarioConquista",
    "Preferencias",
    "RefreshToken",
    "Consentimento",
    "HistoricoAcesso",
    "TokenRedefinicaoSenha",
    "DispositivoPush",
]
