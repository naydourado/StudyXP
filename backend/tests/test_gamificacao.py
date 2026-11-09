# testes unitarios das regras de xp, nivel e ofensiva (sem http)
from datetime import date, datetime

import pytest

from app.core import tempo
from app.models import Usuario
from app.services.gamificacao import faixa_do_nivel, nivel_por_xp, xp_total_para_nivel
from app.services.ofensiva import ofensiva_vigente, registrar_dia_ativo


@pytest.mark.parametrize(
    ("xp", "nivel"),
    [(0, 1), (99, 1), (100, 2), (299, 2), (300, 3), (599, 3), (600, 4), (1000, 5)],
)
def test_nivel_por_xp(xp, nivel):
    assert nivel_por_xp(xp) == nivel


def test_xp_total_para_nivel_cresce_100_por_nivel():
    assert [xp_total_para_nivel(n) for n in range(1, 5)] == [0, 100, 300, 600]


def test_faixa_do_nivel():
    faixa = faixa_do_nivel(320)
    assert faixa == {
        "xp_total": 320,
        "nivel": 3,
        "xp_no_nivel": 20,
        "xp_para_proximo": 300,
        "percentual": 6.7,
    }


def _usuario():
    return Usuario(fuso_horario="America/Sao_Paulo", ofensiva_atual=0, ofensiva_recorde=0)


def test_ofensiva_soma_dias_seguidos_e_zera_ao_pular(relogio):
    u = _usuario()
    registrar_dia_ativo(u)
    registrar_dia_ativo(u)  # mesmo dia nao conta duas vezes
    assert u.ofensiva_atual == 1

    relogio.avancar(days=1)
    registrar_dia_ativo(u)
    assert u.ofensiva_atual == 2

    relogio.avancar(days=2)
    assert ofensiva_vigente(u) == 0  # pulou um dia
    registrar_dia_ativo(u)
    assert u.ofensiva_atual == 1
    assert u.ofensiva_recorde == 2


def test_ofensiva_usa_o_fuso_do_usuario(monkeypatch):
    u = _usuario()
    # 23:30 de 20/10 em sao paulo ja e 21/10 em utc
    monkeypatch.setattr(tempo, "agora", lambda: datetime(2026, 10, 21, 2, 30))
    registrar_dia_ativo(u)
    assert u.ultimo_dia_ativo == date(2026, 10, 20)

    # 00:30 de 21/10 em sao paulo: dia seguinte, a ofensiva continua
    monkeypatch.setattr(tempo, "agora", lambda: datetime(2026, 10, 21, 3, 30))
    registrar_dia_ativo(u)
    assert u.ofensiva_atual == 2
