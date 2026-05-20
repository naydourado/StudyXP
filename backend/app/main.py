from fastapi import FastAPI
from app.database import engine, Base
from app import models

# verifica se a tabela já exite, se não, faz o CREATE
Base.metadata.create_all(bind=engine)

app = FastAPI()


@app.get("/")
def home():
    return {
        "mensagem": "StudyXP API funcionando!"
    }