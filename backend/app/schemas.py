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


# dados que a API devolve
class UsuarioResponse(UsuarioBase):
    id: int
    xp: int
    nivel: int
    data_criacao: datetime

    class Config:
        from_attributes = True