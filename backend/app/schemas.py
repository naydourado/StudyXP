# pydantic - biblioteca que cria os schemas e valida dados da API
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


# dados comuns
class UsuarioBase(BaseModel):
    nome: str = Field(min_length=3, max_length=100)
    email: EmailStr


# dados para cadastro
class UsuarioCreate(UsuarioBase):
    senha: str = Field(min_length=6, max_length=50)


# dados para o login
class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=6, max_length=50)


# dados que a API devolve
class UsuarioResponse(UsuarioBase):
    id: int
    xp: int
    nivel: int
    data_criacao: datetime

    class Config:
        from_attributes = True


class UsuarioUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=3, max_length=100)
    email: EmailStr | None = None


class AlterarSenha(BaseModel):
    senha_atual: str = Field(min_length=6, max_length=50)
    nova_senha: str = Field(min_length=6, max_length=50)


# schema base das tarefas
# define os dados principais que uma tarefa possui
class TarefaBase(BaseModel):
    titulo: str = Field(min_length=3, max_length=150)
    
    # descricao opcional - pode ser enviada vazia
    descricao: str | None = Field(default=None, max_length=255)
    
    # valor padrao: media
    prioridade: str = "media"
    
    # xp recebido ao concluir a tarefa
    # valor padrao: 10
    xp_recompensa: int = Field(default=10, ge=1, le=100)


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


# schema usado para editar tarefa
class TarefaUpdate(BaseModel):

    # titulo opcional
    titulo: str | None = None

    # descricao opcional
    descricao: str | None = None

    # prioridade opcional
    prioridade: str | None = None

    # xp opcional
    xp_recompensa: int | None = None


class HumorBase(BaseModel):
    humor: str = Field(min_length=3, max_length=50)
    observacao: str | None = Field(default=None, max_length=255)


class HumorCreate(HumorBase):
    pass


class HumorResponse(HumorBase):
    id: int
    data_registro: datetime
    usuario_id: int

    class Config:
        from_attributes = True


class FocoBase(BaseModel):
    tempo_minutos: int = Field(ge=1, le=300) # tempo de foco entre 1 e 300 minutos


# schema usado para criar sessao
class FocoCreate(FocoBase):
    pass


class FocoResponse(FocoBase):

    id: int
    data_sessao: datetime
    usuario_id: int

    class Config:
        from_attributes = True


# schema padrao de mensagens da api
class MensagemResponse(BaseModel):
    mensagem: str
    