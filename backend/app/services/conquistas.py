# catalogo de conquistas e verificacao de desbloqueio
from collections.abc import Callable
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import RegistroHumor, SessaoFoco, Tarefa, Usuario, UsuarioConquista
from app.models.enums import StatusSessao, StatusTarefa, TipoSessao
from app.services.gamificacao import nivel_por_xp


@dataclass(frozen=True)
class Estatisticas:
    nivel: int
    ofensiva_recorde: int
    tarefas_concluidas: int
    minutos_foco: int
    registros_humor: int


@dataclass(frozen=True)
class Conquista:
    codigo: str
    nome: str
    descricao: str
    icone: str
    criterio: Callable[[Estatisticas], bool]


# as 4 primeiras sao as do prototipo (tela de perfil)
CATALOGO: list[Conquista] = [
    Conquista("primeiro_nivel", "Primeiro Nível", "Chegue ao nível 2.", "trofeu", lambda e: e.nivel >= 2),
    Conquista("ofensiva_7", "7 dias seguidos", "Estude 7 dias seguidos.", "fogo", lambda e: e.ofensiva_recorde >= 7),
    Conquista("tarefas_10", "10 tarefas", "Conclua 10 tarefas.", "alvo", lambda e: e.tarefas_concluidas >= 10),
    Conquista("foco_5h", "5h focado", "Some 5 horas de foco.", "relogio", lambda e: e.minutos_foco >= 300),
    Conquista(
        "primeiro_humor",
        "Como estou?",
        "Faça o primeiro registro de humor.",
        "sorriso",
        lambda e: e.registros_humor >= 1,
    ),
    Conquista(
        "ofensiva_30", "30 dias seguidos", "Estude 30 dias seguidos.", "fogo", lambda e: e.ofensiva_recorde >= 30
    ),
    Conquista("tarefas_50", "50 tarefas", "Conclua 50 tarefas.", "alvo", lambda e: e.tarefas_concluidas >= 50),
    Conquista("foco_25h", "25h focado", "Some 25 horas de foco.", "relogio", lambda e: e.minutos_foco >= 1500),
]


def calcular_estatisticas(db: Session, usuario: Usuario) -> Estatisticas:
    tarefas = db.scalar(
        select(func.count(Tarefa.id)).where(Tarefa.usuario_id == usuario.id, Tarefa.status == StatusTarefa.CONCLUIDA)
    )
    minutos = db.scalar(
        select(func.sum(SessaoFoco.minutos_validos)).where(
            SessaoFoco.usuario_id == usuario.id,
            SessaoFoco.tipo == TipoSessao.FOCO,
            SessaoFoco.status.in_([StatusSessao.CONCLUIDA, StatusSessao.INTERROMPIDA]),
        )
    )
    humores = db.scalar(select(func.count(RegistroHumor.id)).where(RegistroHumor.usuario_id == usuario.id))
    return Estatisticas(
        nivel=nivel_por_xp(usuario.xp),
        ofensiva_recorde=usuario.ofensiva_recorde,
        tarefas_concluidas=tarefas or 0,
        minutos_foco=minutos or 0,
        registros_humor=humores or 0,
    )


# confere o catalogo e grava as conquistas novas; devolve as que acabaram de ser desbloqueadas
def verificar_conquistas(db: Session, usuario: Usuario) -> list[Conquista]:
    db.flush()
    ja_tem = set(db.scalars(select(UsuarioConquista.codigo).where(UsuarioConquista.usuario_id == usuario.id)))
    estatisticas = calcular_estatisticas(db, usuario)

    novas = [c for c in CATALOGO if c.codigo not in ja_tem and c.criterio(estatisticas)]
    for conquista in novas:
        db.add(UsuarioConquista(usuario_id=usuario.id, codigo=conquista.codigo))
    return novas
