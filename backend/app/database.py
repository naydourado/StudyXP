from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
)

# conexão MySQL
engine = create_engine(DATABASE_URL)

# comunicação com banco
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# funcao responsavel por abrir e fechar a conexão com o banco
def get_db():

    # cria uma sessão de conexão com o mysql
    db = SessionLocal()

    try:
        # disponibiliza a conexão para a rota usar
        yield db

    finally:
        # fecha a conexão ao terminar
        db.close()