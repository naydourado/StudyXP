# ponto de entrada da api: uvicorn app.main:app --reload
# as tabelas sao criadas pelas migracoes do alembic (alembic upgrade head)
import logging

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.erros import registrar_handlers
from app.core.rate_limit import limiter
from app.routers import auth, conta, foco, humor, interno, painel, tarefas

logging.basicConfig(level=logging.INFO)


def criar_app() -> FastAPI:
    settings = get_settings()

    # documentacao (swagger) desligada em producao
    app = FastAPI(
        title="StudyXP API",
        version="1.0.0",
        docs_url=None if settings.producao else "/docs",
        redoc_url=None,
        openapi_url=None if settings.producao else "/openapi.json",
    )

    app.state.limiter = limiter

    @app.exception_handler(RateLimitExceeded)
    async def limite_excedido(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={"detail": "Muitas tentativas. Aguarde um pouco e tente de novo.", "code": "limite_requisicoes"},
        )

    registrar_handlers(app)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "X-Cliente"],
    )

    @app.middleware("http")
    async def cabecalhos_seguranca(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        if settings.producao:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    api = APIRouter(prefix="/api/v1")
    for modulo in (auth, conta, tarefas, foco, humor, painel, interno):
        api.include_router(modulo.router)

    @api.get("/health", tags=["sistema"])
    def health(db: Session = Depends(get_db)):
        db.execute(text("SELECT 1"))
        return {"status": "ok"}

    app.include_router(api)
    return app


app = criar_app()
