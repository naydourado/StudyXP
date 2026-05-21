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
from app.security import gerar_hash_senha, verificar_senha, criar_token_acesso, get_usuario_logado


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


# rota para alterar senha do usuario logado
@router.put(
    "/senha",
    response_model=MensagemResponse
)
def alterar_senha(
    dados: AlterarSenha,
    db: Session = Depends(get_db),
    usuario_logado: Usuario = Depends(get_usuario_logado)
):

    # verifica se a senha atual esta correta
    senha_valida = verificar_senha(
        dados.senha_atual,
        usuario_logado.senha
    )

    if not senha_valida:
        raise HTTPException(
            status_code=400,
            detail="senha atual incorreta"
        )

    # gera hash da nova senha
    usuario_logado.senha = gerar_hash_senha(
        dados.nova_senha
    )

    # salva no banco
    db.commit()

    return {
        "mensagem": "senha alterada com sucesso"
    }