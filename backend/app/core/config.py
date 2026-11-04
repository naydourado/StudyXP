# configuracoes da aplicacao lidas das variaveis de ambiente (ou do arquivo .env)
# a api nao sobe se faltar uma variavel obrigatoria, como SECRET_KEY
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # desenvolvimento | producao | teste
    ambiente: str = "desenvolvimento"

    database_url: str = "mysql+pymysql://root:root@localhost:3306/studyxp"
    # certificado (ca) do mysql na nuvem para conexao tls; vazio = sem tls (banco local)
    database_ssl_ca: str = ""

    # chave usada para assinar os tokens jwt (minimo 32 caracteres)
    secret_key: str = Field(min_length=32)

    # chave fernet usada para criptografar as observacoes do registro de humor
    humor_enc_key: str = Field(min_length=44)

    access_token_minutos: int = 15
    refresh_token_dias: int = 30

    # origens do front web autorizadas no cors (lista em formato json no .env)
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # cookie do refresh token (no web); em producao precisa ser secure
    cookie_secure: bool = False

    # versao vigente dos termos de uso e da politica de privacidade
    termos_versao: str = "2026-10"

    fuso_padrao: str = "America/Sao_Paulo"

    rate_limit_ativo: bool = True

    # endereco do site (usado nos links enviados por e-mail)
    web_url: str = "http://localhost:5173"

    # envio de e-mail: "console" (so escreve no log, para desenvolvimento) ou "resend"
    email_provedor: str = "console"
    email_remetente: str = "StudyXP <onboarding@resend.dev>"
    resend_api_key: str = ""

    # notificacoes push: "expo" (envia de verdade) ou "console" (so escreve no log)
    push_provedor: str = "console"

    # token que o agendador (github actions) envia para rodar as tarefas periodicas;
    # vazio = rotas de jobs desligadas
    cron_token: str = ""

    @property
    def producao(self) -> bool:
        return self.ambiente == "producao"


@lru_cache
def get_settings() -> Settings:
    return Settings()
