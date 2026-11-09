# monta as respostas de gamificacao usadas por varias rotas
from app.models import Usuario
from app.services.conquistas import Conquista
from app.services.gamificacao import faixa_do_nivel
from app.services.ofensiva import ofensiva_vigente


def status_gamificacao(usuario: Usuario) -> dict:
    return {
        **faixa_do_nivel(usuario.xp),
        "ofensiva_atual": ofensiva_vigente(usuario),
        "ofensiva_recorde": usuario.ofensiva_recorde,
    }


def conquista_out(conquista: Conquista, desbloqueada_em=None, desbloqueada=True) -> dict:
    return {
        "codigo": conquista.codigo,
        "nome": conquista.nome,
        "descricao": conquista.descricao,
        "icone": conquista.icone,
        "desbloqueada": desbloqueada,
        "desbloqueada_em": desbloqueada_em,
    }


def resultado_xp(usuario: Usuario, xp_ganho: int, novas: list[Conquista]) -> dict:
    return {
        "xp_ganho": xp_ganho,
        "gamificacao": status_gamificacao(usuario),
        "novas_conquistas": [conquista_out(c) for c in novas],
    }
