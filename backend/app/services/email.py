# envio de e-mails (redefinicao de senha, resumo semanal)
# provedor "console": nao envia, so registra no log (desenvolvimento e testes)
# provedor "resend": envia pela api do resend (plano gratuito)
import html
import logging
from dataclasses import dataclass

import httpx

from app.core.config import get_settings

logger = logging.getLogger("studyxp.email")


@dataclass
class Email:
    para: str
    assunto: str
    texto: str
    html: str


# e-mails "enviados" no modo console ficam aqui (usado pelos testes)
caixa_de_saida: list[Email] = []


def _mascarar(email: str) -> str:
    usuario, _, dominio = email.partition("@")
    return f"{usuario[:2]}***@{dominio}"


def enviar_email(email: Email) -> bool:
    settings = get_settings()

    if settings.email_provedor != "resend":
        caixa_de_saida.append(email)
        logger.info("e-mail (modo console) para %s: %s\n%s", _mascarar(email.para), email.assunto, email.texto)
        return True

    try:
        resposta = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.email_remetente,
                "to": [email.para],
                "subject": email.assunto,
                "text": email.texto,
                "html": email.html,
            },
            timeout=10,
        )
        resposta.raise_for_status()
        return True
    except httpx.HTTPError:
        # nunca loga o conteudo (pode ter link de redefinicao)
        logger.exception("falha ao enviar e-mail para %s", _mascarar(email.para))
        return False


def _layout(titulo: str, corpo_html: str) -> str:
    site = html.escape(get_settings().web_url)
    return f"""<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#222">
<h2 style="color:#4526C9;margin-top:0">{html.escape(titulo)}</h2>
{corpo_html}
<p style="color:#5b6170;font-size:12px;margin-top:32px">StudyXP · Projeto Integrador UNASP-HT ·
<a href="{site}/privacidade" style="color:#4526C9">Política de Privacidade</a></p>
</div>"""


def email_redefinicao_senha(para: str, nome: str, link: str) -> Email:
    texto = (
        f"Olá, {nome}!\n\n"
        "Recebemos um pedido para redefinir a senha da sua conta no StudyXP.\n"
        f"Para criar uma senha nova, acesse (válido por 30 minutos):\n{link}\n\n"
        "Se não foi você, ignore este e-mail: sua senha continua a mesma."
    )
    corpo = (
        f"<p>Olá, {html.escape(nome)}!</p>"
        "<p>Recebemos um pedido para redefinir a senha da sua conta no StudyXP.</p>"
        f'<p><a href="{html.escape(link)}" style="background:#4526C9;color:#fff;padding:12px 20px;'
        'border-radius:10px;text-decoration:none;display:inline-block">Criar nova senha</a></p>'
        "<p>O link vale por 30 minutos. Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>"
    )
    return Email(para, "Redefinição de senha - StudyXP", texto, _layout("Redefinir senha", corpo))


def email_resumo_semanal(para: str, nome: str, resumo: dict) -> Email:
    linhas = [
        ("XP ganho na semana", f"{resumo['xp']} XP"),
        ("Tarefas concluídas", str(resumo["tarefas"])),
        ("Tempo de foco", f"{resumo['minutos_foco']} min"),
        ("Sequência atual", f"{resumo['ofensiva']} dias"),
        ("Nível", str(resumo["nivel"])),
    ]
    site = get_settings().web_url
    texto = (
        f"Olá, {nome}! Seu resumo da semana no StudyXP:\n\n"
        + "\n".join(f"- {r}: {v}" for r, v in linhas)
        + f"\n\nPara parar de receber, desligue o resumo semanal em {site}/configuracoes"
    )
    tabela = "".join(
        f'<tr><td style="padding:6px 12px 6px 0">{html.escape(r)}</td><td><strong>{html.escape(v)}</strong></td></tr>'
        for r, v in linhas
    )
    corpo = (
        f"<p>Olá, {html.escape(nome)}! Seu resumo da semana:</p><table>{tabela}</table>"
        f'<p>Para parar de receber, desligue o resumo semanal em <a href="{html.escape(site)}/configuracoes"'
        ' style="color:#4526C9">Configurações</a>.</p>'
    )
    return Email(para, "Seu resumo da semana - StudyXP", texto, _layout("Resumo da semana", corpo))
