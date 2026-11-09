# configuracao do alembic: usa a mesma DATABASE_URL e os mesmos models da api
#   criar migracao:  alembic revision --autogenerate -m "descricao"
#   aplicar:         alembic upgrade head
from logging.config import fileConfig

import app.models  # noqa: F401 - registra todas as tabelas no metadata
from alembic import context
from app.core.config import get_settings
from app.core.database import Base, criar_engine

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
url = get_settings().database_url


def run_migrations_offline() -> None:
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = criar_engine(url)
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            # necessario para alterar tabelas no sqlite
            render_as_batch=connection.dialect.name == "sqlite",
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
