# atalhos para colunas repetidas nos models
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, Integer
from sqlalchemy.orm import mapped_column

from app.core import tempo


# enum salvo como texto (varchar + check), funciona igual no postgres e no sqlite
def coluna_enum(enum_cls: type[StrEnum], **kwargs):
    return mapped_column(
        Enum(
            enum_cls,
            native_enum=False,
            length=20,
            validate_strings=True,
            values_callable=lambda itens: [item.value for item in itens],
        ),
        **kwargs,
    )


# chave estrangeira para usuarios; apagar o usuario apaga os dados dele (lgpd)
def fk_usuario(**kwargs):
    return mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), index=True, **kwargs)


# lambda para que os testes consigam simular o relogio trocando tempo.agora
def coluna_criado_em():
    return mapped_column(default=lambda: tempo.agora())


def coluna_atualizado_em():
    return mapped_column(default=lambda: tempo.agora(), onupdate=lambda: tempo.agora())
