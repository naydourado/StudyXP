# notificacoes push para o app pelo expo push service (gratuito)
# provedor "console": nao envia, so registra no log (desenvolvimento e testes)
import logging
from dataclasses import dataclass, field

import httpx
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import DispositivoPush

logger = logging.getLogger("studyxp.push")

URL_EXPO_PUSH = "https://exp.host/--/api/v2/push/send"


@dataclass
class Notificacao:
    token: str
    titulo: str
    corpo: str
    dados: dict = field(default_factory=dict)


# notificacoes "enviadas" no modo console ficam aqui (usado pelos testes)
enviadas: list[Notificacao] = []


def enviar_push(db: Session, notificacoes: list[Notificacao]) -> int:
    if not notificacoes:
        return 0

    if get_settings().push_provedor != "expo":
        enviadas.extend(notificacoes)
        logger.info("push (modo console): %d notificacao(oes)", len(notificacoes))
        return len(notificacoes)

    mensagens = [
        {"to": n.token, "title": n.titulo, "body": n.corpo, "data": n.dados, "sound": "default"} for n in notificacoes
    ]
    try:
        resposta = httpx.post(URL_EXPO_PUSH, json=mensagens, timeout=15)
        resposta.raise_for_status()
        recibos = resposta.json().get("data", [])
    except (httpx.HTTPError, ValueError):
        logger.exception("falha ao enviar push")
        return 0

    # app desinstalado ou token invalido: remove o dispositivo
    invalidos = [
        n.token
        for n, recibo in zip(notificacoes, recibos, strict=False)
        if recibo.get("status") == "error" and recibo.get("details", {}).get("error") == "DeviceNotRegistered"
    ]
    if invalidos:
        db.execute(delete(DispositivoPush).where(DispositivoPush.token.in_(invalidos)))

    return sum(1 for recibo in recibos if recibo.get("status") == "ok")
