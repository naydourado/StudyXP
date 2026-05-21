# baixar o que está no txt - pip install -r requirements.txt

from fastapi import FastAPI
from app.database import engine, Base
from app import models

# importa os arquivos de rotas
from app.routes import usuarios, tarefas, dashboard

# cria as tabelas no banco
Base.metadata.create_all(bind=engine)

# cria a aplicacao fastapi
app = FastAPI()

# registra as rotas de usuarios
app.include_router(usuarios.router)

# registra as rotas de tarefas
app.include_router(tarefas.router)

# registra as rotas do dashboard
app.include_router(dashboard.router)

@app.get("/")
def home():
    return {
        "mensagem": "StudyXP API funcionando!"
    }