# baixar o que está no txt - pip install -r requirements.txt

from fastapi import FastAPI
from app.database import engine, Base
from app import models
from fastapi.middleware.cors import CORSMiddleware

# importa os arquivos de rotas
from app.routes import usuarios, tarefas, dashboard, humor, foco

# cria as tabelas no banco
Base.metadata.create_all(bind=engine)

# cria a aplicacao fastapi
app = FastAPI()

# libera comunicacao entre o front (react)
# e o backend (fastapi) atraves do cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"], # permite token/cookies/autenticação
    allow_headers=["*"], # → aceita GET/POST/PUT/DELETE etc
)

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