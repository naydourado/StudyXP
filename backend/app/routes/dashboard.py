from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Usuario, Tarefa, RegistroHumor, SessaoFoco, HistoricoAcesso
from app.security import get_usuario_logado
from datetime import datetime, timedelta, UTC


# cria o router das rotas do dashboard
router = APIRouter()


# rota responsavel por buscar os dados do dashboard
@router.get("/dashboard")
def buscar_dashboard(
    db: Session = Depends(get_db),
    usuario_logado: Usuario = Depends(get_usuario_logado)
):

    # conta quantidade total de tarefas do usuario
    total_tarefas = db.query(Tarefa).filter(
        Tarefa.usuario_id == usuario_logado.id
    ).count()

    # conta quantidade de tarefas concluidas
    tarefas_concluidas = db.query(Tarefa).filter(
        Tarefa.usuario_id == usuario_logado.id,
        Tarefa.status == "concluida"
    ).count()

    # conta quantidade de tarefas pendentes
    tarefas_pendentes = db.query(Tarefa).filter(
        Tarefa.usuario_id == usuario_logado.id,
        Tarefa.status == "pendente"
    ).count()

    # inicia progresso em 0
    progresso = 0

    # calcula percentual de progresso
    if total_tarefas > 0:
        progresso = (
            tarefas_concluidas /
            total_tarefas
        ) * 100

    # soma o tempo total de foco registrado
    tempo_total_foco = db.query(
        func.sum(SessaoFoco.tempo_minutos)
    ).filter(
        SessaoFoco.usuario_id == usuario_logado.id
    ).scalar()

    # evita valor nulo caso nao exista foco registrado
    if tempo_total_foco is None:
        tempo_total_foco = 0

    # busca o ultimo humor registrado
    ultimo_humor = db.query(
        RegistroHumor
    ).filter(
        RegistroHumor.usuario_id == usuario_logado.id
    ).order_by(
        RegistroHumor.data_registro.desc()
    ).first()

    # busca as tarefas mais recentes do usuario
    tarefas = db.query(Tarefa).filter(
        Tarefa.usuario_id == usuario_logado.id
    ).order_by(
        Tarefa.data_criacao.desc()
    ).limit(2).all()

    # busca acessos da ultima semana
    hoje = datetime.now(UTC).date()
    inicio_semana = hoje - timedelta(days=6)

    acessos_semana = db.query(HistoricoAcesso).filter(
        HistoricoAcesso.usuario_id == usuario_logado.id,
        HistoricoAcesso.data_acesso >= inicio_semana
    ).all()

    dias_ativos = []

    for acesso in acessos_semana:
        dia_semana = acesso.data_acesso.isoweekday()

        # converte para o padrao do front:
        # domingo=0, segunda=1, ..., sabado=6
        if dia_semana == 7:
            dia_front = 0
        else:
            dia_front = dia_semana

        if dia_front not in dias_ativos:
            dias_ativos.append(dia_front)

    sequencia_dias = len(dias_ativos)

    # retorna os dados utilizados pelo dashboard
    return {
        "usuario": usuario_logado.nome,
        "xp": usuario_logado.xp,
        "nivel": usuario_logado.nivel,
        "sequencia_dias": sequencia_dias,   
        "total_tarefas": total_tarefas,
        "tarefas_concluidas": tarefas_concluidas,
        "tarefas_pendentes": tarefas_pendentes,
        "progresso": round(progresso, 2),
        "tempo_total_foco": tempo_total_foco,
        "ultimo_humor": (
            ultimo_humor.humor
            if ultimo_humor
            else None
        ),

         # retorna os dias acessados da semana
        "dias_ativos": dias_ativos,

        # converte tarefas para json
        "tarefas": [
            {
                "id": tarefa.id,
                "titulo": tarefa.titulo,
                "status": tarefa.status,
                "xp_recompensa": tarefa.xp_recompensa,
                "prioridade": tarefa.prioridade
            }
            for tarefa in tarefas
        ]
    }