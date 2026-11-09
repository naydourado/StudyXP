# sessoes de foco (pomodoro)
# o servidor marca o horario de inicio e confere o tempo decorrido ao finalizar,
# assim o app nao consegue declarar minutos que nao aconteceram
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core import tempo
from app.core.database import get_db
from app.core.deps import get_usuario_atual
from app.core.erros import ErroAPI
from app.models import SessaoFoco, Usuario
from app.models.enums import OrigemXP, StatusSessao, TipoSessao
from app.schemas.atividades import ResumoFocoHoje, SessaoComXP, SessaoCreate, SessaoOut
from app.services.conquistas import verificar_conquistas
from app.services.gamificacao import registrar_xp, xp_para_minutos_de_foco
from app.services.ofensiva import registrar_dia_ativo
from app.services.resposta import resultado_xp

router = APIRouter(prefix="/foco", tags=["foco"])

# folga para atrasos de rede entre o fim do timer no app e a chamada de finalizar
TOLERANCIA_SEGUNDOS = 30


def _buscar(db: Session, usuario: Usuario, sessao_id: int) -> SessaoFoco:
    sessao = db.scalar(select(SessaoFoco).where(SessaoFoco.id == sessao_id, SessaoFoco.usuario_id == usuario.id))
    if sessao is None:
        raise ErroAPI(404, "Sessão não encontrada.", "sessao_nao_encontrada")
    if sessao.status != StatusSessao.EM_ANDAMENTO:
        raise ErroAPI(409, "A sessão já foi encerrada.", "sessao_encerrada")
    return sessao


@router.post("/sessoes", response_model=SessaoOut, status_code=201)
def iniciar(dados: SessaoCreate, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    # so uma sessao por vez: uma anterior esquecida aberta e cancelada
    db.execute(
        update(SessaoFoco)
        .where(SessaoFoco.usuario_id == usuario.id, SessaoFoco.status == StatusSessao.EM_ANDAMENTO)
        .values(status=StatusSessao.CANCELADA, finalizada_em=tempo.agora())
    )
    sessao = SessaoFoco(
        usuario_id=usuario.id,
        tipo=dados.tipo,
        duracao_planejada=dados.duracao_planejada,
        iniciada_em=tempo.agora(),
    )
    db.add(sessao)
    db.commit()
    return sessao


@router.post("/sessoes/{sessao_id}/finalizar", response_model=SessaoComXP)
def finalizar(sessao_id: int, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    sessao = _buscar(db, usuario, sessao_id)
    agora = tempo.agora()
    decorridos = (agora - sessao.iniciada_em).total_seconds()

    completa = decorridos + TOLERANCIA_SEGUNDOS >= sessao.duracao_planejada * 60
    minutos = sessao.duracao_planejada if completa else int(decorridos // 60)

    sessao.finalizada_em = agora
    sessao.minutos_validos = minutos
    if completa:
        sessao.status = StatusSessao.CONCLUIDA
    elif minutos >= 1:
        sessao.status = StatusSessao.INTERROMPIDA
    else:
        sessao.status = StatusSessao.CANCELADA

    xp = 0
    novas = []
    # pausas nao dao xp; so sessao de foco completa conta para a ofensiva
    if sessao.tipo == TipoSessao.FOCO and minutos >= 1:
        xp = xp_para_minutos_de_foco(db, usuario, minutos)
        sessao.xp_concedido = xp
        registrar_xp(db, usuario, OrigemXP.FOCO, sessao.id, xp)
        if completa:
            registrar_dia_ativo(usuario)
        novas = verificar_conquistas(db, usuario)

    db.commit()
    return {"sessao": sessao, **resultado_xp(usuario, xp, novas)}


@router.post("/sessoes/{sessao_id}/cancelar", response_model=SessaoOut)
def cancelar(sessao_id: int, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    sessao = _buscar(db, usuario, sessao_id)
    sessao.status = StatusSessao.CANCELADA
    sessao.finalizada_em = tempo.agora()
    db.commit()
    return sessao


@router.get("/sessoes", response_model=list[SessaoOut])
def listar(
    limite: int = Query(30, ge=1, le=100),
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(SessaoFoco)
        .where(SessaoFoco.usuario_id == usuario.id)
        .order_by(SessaoFoco.iniciada_em.desc())
        .limit(limite)
    ).all()


@router.get("/resumo-hoje", response_model=ResumoFocoHoje)
def resumo_hoje(usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db)):
    inicio, fim = tempo.limites_do_dia(tempo.dia_local(tempo.agora(), usuario.fuso_horario), usuario.fuso_horario)
    filtro = (
        SessaoFoco.usuario_id == usuario.id,
        SessaoFoco.tipo == TipoSessao.FOCO,
        SessaoFoco.iniciada_em >= inicio,
        SessaoFoco.iniciada_em < fim,
    )
    minutos = db.scalar(select(func.sum(SessaoFoco.minutos_validos)).where(*filtro))
    concluidas = db.scalar(
        select(func.count(SessaoFoco.id)).where(*filtro, SessaoFoco.status == StatusSessao.CONCLUIDA)
    )
    return {"minutos_foco": minutos or 0, "sessoes_concluidas": concluidas or 0}
