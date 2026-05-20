from fastapi import FastAPI
from app.database import engine, Base
from app import models
from app.routes import usuarios

# verifica se a tabela já exite, se não, faz o CREATE
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(usuarios.router)


@app.get("/")
def home():
    return {
        "mensagem": "StudyXP API funcionando!"
    }