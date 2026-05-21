# baixar o que está no txt - pip install -r requirements.txt

from fastapi import FastAPI
from app.database import engine, Base
from app import models

# importa os arquivos de rotas
from app.routes import usuarios, tarefas, dashboard, humor, foco

# cria as tabelas no banco
Base.metadata.create_all(bind=engine)

# cria a aplicacao fastapi
app = FastAPI()

# registros de cada rota
app.include_router(usuarios.router)
app.include_router(tarefas.router)
app.include_router(dashboard.router)
app.include_router(humor.router)
app.include_router(foco.router)

@app.get("/")
def home():
    return {
        "mensagem": "StudyXP API funcionando!"
    }