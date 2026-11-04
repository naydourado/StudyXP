# valores fixos usados nas tabelas e validados pela api
from enum import StrEnum


class Prioridade(StrEnum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"


class StatusTarefa(StrEnum):
    PENDENTE = "pendente"
    CONCLUIDA = "concluida"


class Humor(StrEnum):
    OTIMO = "otimo"
    BOM = "bom"
    NEUTRO = "neutro"
    ANSIOSO = "ansioso"
    CANSADO = "cansado"


class TipoSessao(StrEnum):
    FOCO = "foco"
    PAUSA_CURTA = "pausa_curta"
    PAUSA_LONGA = "pausa_longa"


class StatusSessao(StrEnum):
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDA = "concluida"
    # encerrada antes do tempo planejado: conta os minutos, mas nao conta para a ofensiva
    INTERROMPIDA = "interrompida"
    CANCELADA = "cancelada"


class OrigemXP(StrEnum):
    TAREFA = "tarefa"
    FOCO = "foco"
    HUMOR = "humor"


class TipoConsentimento(StrEnum):
    TERMOS = "termos"
    HUMOR = "humor"
