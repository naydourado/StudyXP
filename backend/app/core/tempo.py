# funcoes de data e hora
# o banco guarda tudo em utc (sem fuso); as regras de "dia" usam o fuso do usuario
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


# sempre chamar como tempo.agora() para que os testes consigam simular o relogio
def agora() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def fuso_valido(nome: str) -> bool:
    try:
        ZoneInfo(nome)
        return True
    except (ZoneInfoNotFoundError, ValueError):
        return False


def para_local(momento_utc: datetime, fuso: str) -> datetime:
    return momento_utc.replace(tzinfo=UTC).astimezone(ZoneInfo(fuso))


def dia_local(momento_utc: datetime, fuso: str) -> date:
    return para_local(momento_utc, fuso).date()


# inicio e fim (em utc) de um dia no fuso do usuario
def limites_do_dia(dia: date, fuso: str) -> tuple[datetime, datetime]:
    inicio = datetime.combine(dia, time.min, tzinfo=ZoneInfo(fuso))
    fim = inicio + timedelta(days=1)
    return (
        inicio.astimezone(UTC).replace(tzinfo=None),
        fim.astimezone(UTC).replace(tzinfo=None),
    )
