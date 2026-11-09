from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Consentimento
from app.models.enums import TipoConsentimento


# vale o ultimo registro: o historico guarda cada aceite e cada revogacao
def consentiu_humor(db: Session, usuario_id: int) -> bool:
    ultimo = db.scalar(
        select(Consentimento)
        .where(Consentimento.usuario_id == usuario_id, Consentimento.tipo == TipoConsentimento.HUMOR)
        .order_by(Consentimento.id.desc())
        .limit(1)
    )
    return bool(ultimo and ultimo.concedido)
