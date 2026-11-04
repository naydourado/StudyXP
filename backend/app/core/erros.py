# formato padrao de erro da api: {"detail": "mensagem", "code": "codigo"}
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("studyxp")


class ErroAPI(HTTPException):
    def __init__(self, status_code: int, detail: str, code: str, headers: dict | None = None):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.code = code


def registrar_handlers(app: FastAPI) -> None:
    @app.exception_handler(ErroAPI)
    async def erro_api(request: Request, exc: ErroAPI):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "code": exc.code},
            headers=exc.headers,
        )

    @app.exception_handler(HTTPException)
    async def erro_http(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "code": "http_" + str(exc.status_code)},
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def erro_validacao(request: Request, exc: RequestValidationError):
        erros = [
            {
                "campo": ".".join(str(parte) for parte in erro["loc"] if parte != "body"),
                "mensagem": erro["msg"],
            }
            for erro in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={"detail": "Dados inválidos.", "code": "validacao", "erros": erros},
        )

    # nunca devolve stack trace para o cliente; o detalhe fica so no log
    @app.exception_handler(Exception)
    async def erro_inesperado(request: Request, exc: Exception):
        logger.exception("erro nao tratado em %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Erro interno. Tente novamente.", "code": "erro_interno"},
        )
