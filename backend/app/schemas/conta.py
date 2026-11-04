from datetime import datetime
from typing import Annotated, Literal

from pydantic import EmailStr, Field, StringConstraints, field_validator

from app.core.tempo import fuso_valido
from app.schemas.comum import Modelo

Nome = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
Senha = Annotated[str, Field(min_length=8, max_length=128)]


class Cadastro(Modelo):
    nome: Nome
    email: EmailStr = Field(max_length=120)
    senha: Senha
    # o cadastro so e aceito com os dois marcados (termos/politica e maioridade)
    aceite_termos: bool
    maior_de_idade: bool


class Login(Modelo):
    email: EmailStr
    senha: str = Field(min_length=1, max_length=128)


class EsqueciSenha(Modelo):
    email: EmailStr


class RedefinirSenha(Modelo):
    token: str = Field(min_length=20, max_length=200)
    nova_senha: Senha


class RefreshIn(Modelo):
    refresh_token: str | None = Field(default=None, max_length=200)


class UsuarioOut(Modelo):
    id: int
    nome: str
    email: str
    bio: str | None
    fuso_horario: str
    criado_em: datetime
    termos_versao: str
    # true quando os termos/politica mudaram desde o ultimo aceite: o app pede nova confirmacao
    termos_pendentes: bool


class Tokens(Modelo):
    access_token: str
    token_type: str = "bearer"
    expira_em_segundos: int
    # so vem no corpo para o app mobile; no web o refresh fica em cookie httponly
    refresh_token: str | None = None
    usuario: UsuarioOut


class PerfilUpdate(Modelo):
    nome: Nome | None = None
    email: EmailStr | None = Field(default=None, max_length=120)
    bio: Annotated[str, StringConstraints(strip_whitespace=True, max_length=280)] | None = None
    fuso_horario: str | None = Field(default=None, max_length=50)

    @field_validator("fuso_horario")
    @classmethod
    def validar_fuso(cls, valor: str | None) -> str | None:
        if valor is not None and not fuso_valido(valor):
            raise ValueError("fuso horário inválido")
        return valor


class TrocaSenha(Modelo):
    senha_atual: str = Field(min_length=1, max_length=128)
    nova_senha: Senha


class ConfirmacaoSenha(Modelo):
    senha: str = Field(min_length=1, max_length=128)


class PreferenciasIO(Modelo):
    lembrete_tarefas: bool
    som_pomodoro: bool
    resumo_semanal: bool


class ConsentimentosOut(Modelo):
    termos_versao: str
    termos_aceitos_em: datetime
    humor: bool


class DispositivoIn(Modelo):
    # formato do expo: ExponentPushToken[...]
    token: str = Field(pattern=r"^Expo(nent)?PushToken\[[\w-]+\]$", max_length=200)
    plataforma: Literal["android", "ios"]


class DispositivoRemover(Modelo):
    token: str = Field(max_length=200)


class ConsentimentoHumorIn(Modelo):
    humor: bool
