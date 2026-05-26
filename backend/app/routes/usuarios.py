from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario
from app.schemas import (
    UsuarioCreate,
    UsuarioResponse,
    UsuarioLogin,
    UsuarioUpdate,
    AlterarSenha,
    MensagemResponse
)
from datetime import datetime, UTC
from app.security import gerar_hash_senha, verificar_senha, criar_token_acesso, get_usuario_logado
from app.models import Usuario, Tarefa, RegistroHumor, SessaoFoco, HistoricoAcesso


# APIRouter() - separa rotas por arquivo
router = APIRouter()


# rota para login do usuario
@router.post("/login")
def login(
    dados: UsuarioLogin,
    db: Session = Depends(get_db)
):

    # busca usuario pelo email informado
    usuario = db.query(Usuario).filter(
        Usuario.email == dados.email
    ).first()

    # verifica se o usuario existe
    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="email ou senha invalidos"
        )

    # compara a senha digitada com a senha criptografada no banco
    senha_valida = verificar_senha(
        dados.senha,
        usuario.senha
    )

    # se a senha estiver errada, retorna erro
    if not senha_valida:
        raise HTTPException(
            status_code=401,
            detail="email ou senha invalidos"
        )
    
    # controla sequencia e registra acesso
    agora = datetime.now(UTC)

    novo_acesso = HistoricoAcesso(
        usuario_id=usuario.id,
        data_acesso=agora
    )

    db.add(novo_acesso)

    if usuario.ultimo_acesso:
        dias_diferenca = (
            agora.date() -
            usuario.ultimo_acesso.date()
        ).days

        if dias_diferenca == 1:
            usuario.sequencia_dias += 1

        elif dias_diferenca > 1:
            usuario.sequencia_dias = 1
    else:
        usuario.sequencia_dias = 1

    usuario.ultimo_acesso = agora

    db.commit()
    db.refresh(usuario)

    # cria o token com o id do usuario
    token = criar_token_acesso(
        dados={"sub": str(usuario.id)}
    )

    # retorna o token e dados basicos do usuario
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario.id,
            "nome": usuario.nome,
            "email": usuario.email,
            "xp": usuario.xp,
            "nivel": usuario.nivel
        }
    }

# rota protegida para buscar os dados do usuario logado
@router.get("/me", response_model=UsuarioResponse)
def buscar_meus_dados(
    usuario_logado: Usuario = Depends(get_usuario_logado)
):

    # retorna o usuario autenticado pelo token
    return usuario_logado


# rota para cadastrar um novo usuario
@router.post("/usuarios", response_model=UsuarioResponse, status_code=201) # não mostra a senha, porque o UsuarioResponse não tem esse campo
def criar_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db)
):

    # verifica se ja existe um usuario com o mesmo email
    email_existente = db.query(Usuario).filter(
        Usuario.email == usuario.email
    ).first()

    # se o email ja existir, retorna erro
    if email_existente:
        raise HTTPException(
            status_code=400,
            detail="email ja cadastrado"
        )

    # cria um novo usuario com os dados recebidos
    novo_usuario = Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha=gerar_hash_senha(usuario.senha) # puxando a criptografia da senha
    )

    # adiciona o usuario na sessao do banco
    db.add(novo_usuario)

    # salva o usuario no mysql
    db.commit()

    # atualiza o objeto com os dados gerados pelo banco
    db.refresh(novo_usuario)

    # retorna o usuario criado
    return novo_usuario

@router.put("/perfil", response_model=UsuarioResponse)
def editar_perfil(
    dados: UsuarioUpdate,
    db: Session = Depends(get_db),
    usuario_logado: Usuario = Depends(get_usuario_logado)
):

    if dados.email is not None:
        email_existente = db.query(Usuario).filter(
            Usuario.email == dados.email,
            Usuario.id != usuario_logado.id
        ).first()

        if email_existente:
            raise HTTPException(
                status_code=400,
                detail="email ja cadastrado"
            )

        usuario_logado.email = dados.email

    if dados.nome is not None:
        usuario_logado.nome = dados.nome

    db.commit()
    db.refresh(usuario_logado)

    return usuario_logado


# rota para alterar senha do usuário logado
@router.put("/alterar-senha")
def alterar_senha(
    dados: AlterarSenha,
    db: Session = Depends(get_db),
    usuario=Depends(get_usuario_logado)
):
    # verifica se senha atual está correta
    if not verificar_senha(
        dados.senha_atual,
        usuario.senha
    ):
        raise HTTPException(
            status_code=400,
            detail="Senha atual incorreta."
        )

    # gera hash da nova senha
    usuario.senha = gerar_hash_senha(
        dados.nova_senha
    )

    db.commit()

    return {
        "mensagem": "Senha alterada com sucesso."
    }

# rota para excluir a conta do usuario logado
@router.delete("/perfil")
def excluir_conta(
    db: Session = Depends(get_db),
    usuario_logado: Usuario = Depends(get_usuario_logado)
):
    db.query(Tarefa).filter(
        Tarefa.usuario_id == usuario_logado.id
    ).delete()

    db.query(RegistroHumor).filter(
        RegistroHumor.usuario_id == usuario_logado.id
    ).delete()

    db.query(SessaoFoco).filter(
        SessaoFoco.usuario_id == usuario_logado.id
    ).delete()

    db.query(HistoricoAcesso).filter(
        HistoricoAcesso.usuario_id == usuario_logado.id
    ).delete()

    db.delete(usuario_logado)
    db.commit()

    return {
        "mensagem": "Conta excluida com sucesso."
    }