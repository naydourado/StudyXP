# cadastro, login, renovacao de sessao, logout e redefinicao de senha
#
# web: o refresh token vai num cookie httponly (o javascript nao consegue ler)
# mobile: envia o header "X-Cliente: mobile" e recebe o refresh token no corpo,
#         que o app guarda no secure store
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core import tempo
from app.core.config import get_settings
from app.core.database import get_db
from app.core.erros import ErroAPI
from app.core.rate_limit import limiter
from app.core.seguranca import (
    criar_access_token,
    emitir_refresh_token,
    gerar_hash_senha,
    hash_token,
    revogar_refresh_token,
    revogar_todos_do_usuario,
    rotacionar_refresh_token,
    verificar_senha,
)
from app.models import Consentimento, HistoricoAcesso, Preferencias, TokenRedefinicaoSenha, Usuario
from app.models.enums import TipoConsentimento
from app.schemas.comum import Mensagem
from app.schemas.conta import Cadastro, EsqueciSenha, Login, RedefinirSenha, RefreshIn, Tokens
from app.services.email import email_redefinicao_senha, enviar_email

router = APIRouter(prefix="/auth", tags=["autenticação"])

COOKIE_REFRESH = "studyxp_refresh"


def _cliente_mobile(request: Request) -> bool:
    return request.headers.get("x-cliente", "").lower() == "mobile"


def _responder_tokens(request: Request, response: Response, usuario: Usuario, refresh: str) -> dict:
    settings = get_settings()
    corpo = {
        "access_token": criar_access_token(usuario.id),
        "expira_em_segundos": settings.access_token_minutos * 60,
        "usuario": usuario,
    }

    if _cliente_mobile(request):
        corpo["refresh_token"] = refresh
    else:
        response.set_cookie(
            COOKIE_REFRESH,
            refresh,
            max_age=settings.refresh_token_dias * 86400,
            httponly=True,
            secure=settings.cookie_secure,
            samesite="lax",
            path="/api/v1/auth",
        )
    return corpo


def _ler_refresh(request: Request, dados: RefreshIn | None) -> str | None:
    if dados is not None and dados.refresh_token:
        return dados.refresh_token
    return request.cookies.get(COOKIE_REFRESH)


# minimizacao (lgpd art. 6, iii): guarda so o tipo de acesso, nao a identificacao do navegador
def _dispositivo(request: Request) -> str:
    return "app" if _cliente_mobile(request) else "web"


@router.post("/cadastro", response_model=Tokens, status_code=201)
@limiter.limit("5/hour")
def cadastrar(request: Request, response: Response, dados: Cadastro, db: Session = Depends(get_db)):
    if not dados.aceite_termos:
        raise ErroAPI(422, "É preciso aceitar os Termos de Uso e a Política de Privacidade.", "termos_obrigatorios")
    if not dados.maior_de_idade:
        raise ErroAPI(422, "O StudyXP é destinado a maiores de 18 anos.", "idade_minima")

    email = dados.email.lower()
    if db.scalar(select(Usuario.id).where(Usuario.email == email)):
        raise ErroAPI(409, "Este e-mail já está cadastrado.", "email_em_uso")

    settings = get_settings()
    agora = tempo.agora()
    usuario = Usuario(
        nome=dados.nome,
        email=email,
        senha_hash=gerar_hash_senha(dados.senha),
        fuso_horario=settings.fuso_padrao,
        termos_versao=settings.termos_versao,
        termos_aceitos_em=agora,
    )
    db.add(usuario)
    db.flush()

    db.add(Preferencias(usuario_id=usuario.id))
    db.add(
        Consentimento(
            usuario_id=usuario.id,
            tipo=TipoConsentimento.TERMOS,
            versao=settings.termos_versao,
            concedido=True,
        )
    )
    refresh = emitir_refresh_token(db, usuario.id, dispositivo=_dispositivo(request))
    db.commit()

    return _responder_tokens(request, response, usuario, refresh)


@router.post("/login", response_model=Tokens)
@limiter.limit("5/minute")
def login(request: Request, response: Response, dados: Login, db: Session = Depends(get_db)):
    usuario = db.scalar(select(Usuario).where(Usuario.email == dados.email.lower()))

    # mesma mensagem e mesmo tempo de resposta para e-mail inexistente ou senha errada
    if not verificar_senha(dados.senha, usuario.senha_hash if usuario else None):
        raise ErroAPI(401, "E-mail ou senha inválidos.", "credenciais_invalidas")

    db.add(HistoricoAcesso(usuario_id=usuario.id, ip=request.client.host if request.client else None))
    refresh = emitir_refresh_token(db, usuario.id, dispositivo=_dispositivo(request))
    db.commit()

    return _responder_tokens(request, response, usuario, refresh)


@router.post("/refresh", response_model=Tokens)
@limiter.limit("30/minute")
def renovar(request: Request, response: Response, dados: RefreshIn | None = None, db: Session = Depends(get_db)):
    token = _ler_refresh(request, dados)
    if not token:
        raise ErroAPI(401, "Sessão inválida.", "refresh_ausente")

    usuario_id, novo = rotacionar_refresh_token(db, token, _dispositivo(request))
    usuario = db.get(Usuario, usuario_id)
    db.commit()

    return _responder_tokens(request, response, usuario, novo)


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, dados: RefreshIn | None = None, db: Session = Depends(get_db)):
    token = _ler_refresh(request, dados)
    if token:
        revogar_refresh_token(db, token)
        db.commit()
    response.delete_cookie(COOKIE_REFRESH, path="/api/v1/auth")
    response.status_code = 204
    return response


VALIDADE_REDEFINICAO = timedelta(minutes=30)
MENSAGEM_ESQUECI = "Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha."


# sempre a mesma resposta, exista ou nao a conta (nao revela quais e-mails estao cadastrados)
@router.post("/esqueci-senha", response_model=Mensagem, status_code=202)
@limiter.limit("3/hour")
def esqueci_senha(request: Request, dados: EsqueciSenha, db: Session = Depends(get_db)):
    usuario = db.scalar(select(Usuario).where(Usuario.email == dados.email.lower()))
    if usuario is None:
        return {"mensagem": MENSAGEM_ESQUECI}

    agora = tempo.agora()
    # um pedido novo invalida os anteriores
    db.execute(
        update(TokenRedefinicaoSenha)
        .where(TokenRedefinicaoSenha.usuario_id == usuario.id, TokenRedefinicaoSenha.usado_em.is_(None))
        .values(usado_em=agora)
    )
    token = secrets.token_urlsafe(32)
    db.add(
        TokenRedefinicaoSenha(
            usuario_id=usuario.id,
            token_hash=hash_token(token),
            expira_em=agora + VALIDADE_REDEFINICAO,
        )
    )
    db.commit()

    link = f"{get_settings().web_url}/redefinir-senha?token={token}"
    enviar_email(email_redefinicao_senha(usuario.email, usuario.nome, link))
    return {"mensagem": MENSAGEM_ESQUECI}


@router.post("/redefinir-senha", response_model=Mensagem)
@limiter.limit("10/hour")
def redefinir_senha(request: Request, dados: RedefinirSenha, db: Session = Depends(get_db)):
    registro = db.scalar(
        select(TokenRedefinicaoSenha).where(TokenRedefinicaoSenha.token_hash == hash_token(dados.token))
    )
    agora = tempo.agora()

    if registro is None or registro.usado_em is not None or registro.expira_em <= agora:
        raise ErroAPI(400, "Link inválido ou expirado. Peça um novo.", "token_redefinicao_invalido")

    usuario = db.get(Usuario, registro.usuario_id)
    usuario.senha_hash = gerar_hash_senha(dados.nova_senha)
    registro.usado_em = agora
    # quem tinha a senha antiga perde as sessoes abertas
    revogar_todos_do_usuario(db, usuario.id)
    db.commit()
    return {"mensagem": "Senha alterada. Entre com a nova senha."}
