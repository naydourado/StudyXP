# rotas internas chamadas pelo agendador (github actions), protegidas pelo header X-Cron-Token
import secrets

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.erros import ErroAPI
from app.services.jobs import JOBS

router = APIRouter(prefix="/interno", tags=["interno"], include_in_schema=False)


def _exigir_token(x_cron_token: str = Header(default="")) -> None:
    esperado = get_settings().cron_token
    # sem CRON_TOKEN configurado as rotas nem existem; token errado tambem responde 404
    if not esperado or not secrets.compare_digest(x_cron_token.encode(), esperado.encode()):
        raise ErroAPI(404, "Não encontrado.", "nao_encontrado")


@router.post("/jobs/{nome}", dependencies=[Depends(_exigir_token)])
def rodar_job(nome: str, db: Session = Depends(get_db)):
    job = JOBS.get(nome)
    if job is None:
        raise ErroAPI(404, "Não encontrado.", "nao_encontrado")
    return {"job": nome, "resultado": job(db)}
