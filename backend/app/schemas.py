# pydantic - biblioteca que cria os schemas e valida dados da API
from pydantic import BaseModel, EmailStr
from datetime import datetime


# dados comuns
class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr


# dados para cadastro
class UsuarioCreate(UsuarioBase):
    senha: str

# dados para o login
class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str


# dados que a API devolve
class UsuarioResponse(UsuarioBase):
    id: int
    xp: int
    nivel: int
    data_criacao: datetime

    class Config:
        from_attributes = True


# schema base das tarefas
# define os dados principais que uma tarefa possui
class TarefaBase(BaseModel):
    titulo: str

    # descricao opcional - pode ser enviada vazia
    descricao: str | None = None

    # valor padrao: media
    prioridade: str = "media"

    # xp recebido ao concluir a tarefa
    # valor padrao: 10
    xp_recompensa: int = 10


# schema usado para criacao de tarefa
# herda todos os campos de TarefaBase
class TarefaCreate(TarefaBase):
    pass


# schema de resposta da api
# define os dados devolvidos ao front
class TarefaResponse(TarefaBase):
    id: int
    status: str
    data_criacao: datetime
    # id do usuario dono da tarefa
    usuario_id: int

    class Config:
        # permite converter model sqlalchemy
        # em schema pydantic automaticamente
        from_attributes = True