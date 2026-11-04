# ofensiva (dias seguidos de estudo)
# dia ativo = concluiu ao menos uma tarefa ou uma sessao de foco completa, no fuso do usuario
from datetime import timedelta

from app.core import tempo
from app.models import Usuario


def registrar_dia_ativo(usuario: Usuario) -> None:
    hoje = tempo.dia_local(tempo.agora(), usuario.fuso_horario)
    ultimo = usuario.ultimo_dia_ativo

    if ultimo == hoje:
        return

    if ultimo == hoje - timedelta(days=1):
        usuario.ofensiva_atual += 1
    else:
        usuario.ofensiva_atual = 1

    usuario.ofensiva_recorde = max(usuario.ofensiva_recorde, usuario.ofensiva_atual)
    usuario.ultimo_dia_ativo = hoje


# a ofensiva so continua valendo se o ultimo dia ativo foi hoje ou ontem
def ofensiva_vigente(usuario: Usuario) -> int:
    if usuario.ultimo_dia_ativo is None:
        return 0
    hoje = tempo.dia_local(tempo.agora(), usuario.fuso_horario)
    if usuario.ultimo_dia_ativo >= hoje - timedelta(days=1):
        return usuario.ofensiva_atual
    return 0
