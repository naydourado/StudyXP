# Plano de Resposta a Incidentes de Segurança — StudyXP

**Versão:** 1.0 (22/10/2026) · **Situação:** rascunho para revisão

Um **incidente** é qualquer evento que comprometa a confidencialidade, integridade ou disponibilidade dos dados pessoais: vazamento, acesso indevido, perda de dados, chave ou senha exposta, conta invadida.

## 1. Papéis

| Papel | Quem | Responsabilidade |
|---|---|---|
| Coordenação do incidente | Gerente do projeto (Nayra) | Decide, comunica e registra |
| Resposta técnica | Tech lead (Gabriel) + quem estiver disponível | Contém, investiga e corrige |
| Comunicação aos titulares e à ANPD | Gerente do projeto, com apoio do orientador | Redige e envia as comunicações |
| Registro | Responsável por QA (Isabela) | Mantém o relatório do incidente |

Contatos de emergência do grupo: [preencher].

## 2. Etapas

### 2.1 Identificar (imediato)

- Fontes: alerta do GitHub Secret Scanning, Dependabot, monitor de disponibilidade, erro estranho nos logs do Render, aviso de um usuário.
- Abrir um registro (modelo no fim deste documento) com data, hora e o que se sabe.

### 2.2 Conter (primeiras horas)

| Situação | Ação imediata |
|---|---|
| `SECRET_KEY` exposta | Gerar nova chave (`python scripts/gerar_chaves.py`), trocar no Render e reiniciar — todos os tokens antigos deixam de valer |
| Senha do banco exposta | Trocar a senha na Aiven, atualizar `DATABASE_URL` no Render |
| `HUMOR_ENC_KEY` exposta | Tratar como vazamento das notas de humor; gerar nova chave e recriptografar as notas (script a ser escrito na hora) |
| Conta de usuário invadida | Revogar as sessões do usuário (troca de senha pelo link de redefinição) e orientar o titular |
| Falha que expõe dados de outros usuários | Tirar a funcionalidade do ar (rollback do deploy no Render) |
| Chave do Resend ou token do agendador exposto | Revogar no painel do serviço e gerar outro |

### 2.3 Avaliar (até 48 horas)

- Quais dados, de quantos titulares, por quanto tempo ficaram expostos.
- Se havia dado sensível (humor) e se as notas estavam criptografadas.
- Se o incidente **pode acarretar risco ou dano relevante** aos titulares (critério da ANPD). Em geral sim quando envolve dado sensível, senhas, ou grande volume de titulares.

### 2.4 Comunicar (se houver risco ou dano relevante)

- **ANPD:** pelo formulário de comunicação de incidente no site da ANPD, no prazo do Regulamento de Comunicação de Incidente de Segurança (Resolução CD/ANPD nº 15/2024 — conferir o prazo vigente na data).
- **Titulares afetados:** e-mail em linguagem simples, no mesmo prazo, contendo:
  - o que aconteceu e quando;
  - quais dados foram afetados;
  - o que já foi feito;
  - o que o titular deve fazer (por exemplo, trocar a senha);
  - o canal para dúvidas.
- **Professor orientador e UNASP:** informar no mesmo dia.

### 2.5 Corrigir e aprender

- Corrigir a causa (código, configuração, dependência) com teste automatizado que impeça a repetição.
- Fazer uma retrospectiva sem culpados e atualizar este plano e o RIPD.
- Guardar o registro do incidente (a LGPD exige manter o registro mesmo quando não há comunicação à ANPD).

## 3. Modelo de registro de incidente

```
Data/hora da detecção:
Quem detectou e como:
Descrição:
Dados e titulares afetados (estimativa):
Havia dado sensível? Estava criptografado?
Ações de contenção (com horário):
Avaliação de risco: [baixo / relevante] — justificativa:
Comunicação à ANPD: [sim/não] — data e protocolo:
Comunicação aos titulares: [sim/não] — data:
Causa raiz:
Correção definitiva (PR/commit):
Lições aprendidas:
```

## 4. Prevenção

- Segredos só em variáveis de ambiente; `.env` fora do Git e Secret Scanning ativo.
- Dependabot e auditoria de dependências no CI.
- Backups semanais criptografados; teste de restauração na homologação.
- Revisão de código obrigatória em todo PR.
