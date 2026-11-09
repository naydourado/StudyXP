# conexao com o banco e sessao do sqlalchemy
import tempfile

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def criar_engine(url: str):
    if url.startswith("sqlite"):
        # sqlite e usado apenas em testes e demonstracoes locais
        # banco em memoria precisa de uma unica conexao compartilhada (StaticPool);
        # banco em arquivo usa o pool normal (uma conexao por thread)
        em_memoria = url in ("sqlite://", "sqlite:///:memory:")
        engine = create_engine(
            url,
            connect_args={"check_same_thread": False},
            **({"poolclass": StaticPool} if em_memoria else {}),
        )

        # o sqlite so respeita "on delete cascade" com esta opcao ligada
        @event.listens_for(engine, "connect")
        def _ligar_fks(conexao, _):
            conexao.execute("PRAGMA foreign_keys=ON")

        return engine

    # pool_pre_ping evita erro com conexoes derrubadas pelo provedor do banco
    return create_engine(url, pool_pre_ping=True, pool_recycle=280, connect_args=_args_tls())


# conexao criptografada (tls) com o postgres na nuvem: DATABASE_SSL_CA recebe o certificado
# do provedor (o conteudo "-----BEGIN CERTIFICATE-----..." ou o caminho do arquivo)
def _args_tls() -> dict:
    ca = get_settings().database_ssl_ca.strip()
    if not ca:
        return {}
    if ca.startswith("-----BEGIN"):
        arquivo = tempfile.NamedTemporaryFile("w", suffix=".pem", delete=False)
        # paineis de hospedagem as vezes guardam as quebras de linha como "\n" literal
        arquivo.write(ca.replace("\\n", "\n"))
        arquivo.close()
        ca = arquivo.name
    return {"sslmode": "verify-full", "sslrootcert": ca}


engine = criar_engine(get_settings().database_url)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


# dependencia que abre e fecha a sessao do banco em cada requisicao
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
