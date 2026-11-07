# Riscos Jurídicos — StudyXP

**Versão:** 1.0 (27/10/2026) · **Situação:** levantamento técnico para revisão do professor orientador

> Este documento foi preparado pela equipe técnica e **não substitui a análise de um profissional do Direito**.
> As normas citadas devem ser conferidas na versão vigente antes da entrega.

Escala: probabilidade (P) e impacto (I) de 1 (baixo) a 3 (alto). **Status:** ✅ tratado no projeto · ⚠️ parcialmente tratado · ❌ depende de decisão ou ação do time.

## 1. Proteção de dados (LGPD — Lei 13.709/2018)

| # | Risco | P | I | O que foi feito | Status |
|---|---|---|---|---|---|
| L1 | Tratar dado sensível (humor) sem base legal adequada | 2 | 3 | Consentimento específico e destacado antes do primeiro registro; revogação com apagamento imediato; registro do aceite com versão e data; notas criptografadas; RIPD elaborado | ✅ |
| L2 | Coletar dados além do necessário (art. 6º, III) | 2 | 2 | Cadastro só com nome ou apelido, e-mail e senha; sem CPF, telefone, localização ou analytics; sessão guarda só "web" ou "app" (não o navegador); permissões de câmera, microfone, localização e contatos bloqueadas no app | ✅ |
| L3 | Falta de transparência (art. 9º) | 2 | 2 | Política com finalidades, bases legais, retenção, operadores e direitos; resumo em linguagem simples; avisos curtos nos formulários; aviso de cookies; mesmo texto no site, no app e nos documentos, verificado no CI | ✅ |
| L4 | Não atender aos direitos do titular (art. 18) | 1 | 2 | Exportação completa (inclui logins e sessões), correção, exclusão imediata e revogação na própria plataforma | ✅ |
| L5 | **Encarregado/canal de contato não definido** (art. 41) | 3 | 2 | Agente de pequeno porte pode ser dispensado de indicar encarregado, mas precisa de canal de comunicação (Resolução CD/ANPD nº 2/2022 — conferir) | ❌ definir o e-mail |
| L6 | Transferência internacional sem fundamento (art. 33) | 2 | 2 | Informada na Política com o fundamento do art. 33, IX (execução de contrato a pedido do titular). Para algo além do projeto acadêmico, avaliar cláusulas-padrão da ANPD (Resolução CD/ANPD nº 19/2024 — conferir) | ⚠️ |
| L7 | Incidente de segurança sem resposta adequada | 1 | 3 | Plano de resposta com prazos e modelo de registro (Resolução CD/ANPD nº 15/2024 — conferir o prazo vigente) | ✅ |
| L8 | Segredos já expostos no histórico do Git (`.env` antigo) | 3 | 3 | `.env` removido do repositório e `SECRET_KEY` trocada localmente | ❌ trocar a senha do PostgreSQL; avaliar limpar o histórico |
| L9 | Reter dados por tempo excessivo | 1 | 2 | Logs de acesso apagados após 6 meses; tokens vencidos apagados; backups por 30 dias | ⚠️ não há regra para contas inativas — decidir (ex.: aviso e exclusão após 24 meses sem acesso) |
| L10 | Mudar os termos sem novo aceite | 1 | 2 | Versão dos textos amarrada à `TERMOS_VERSAO` da API; com versão nova, o usuário precisa aceitar de novo antes de usar | ✅ |
| L11 | Envio de e-mail sem consentimento | 1 | 1 | Resumo semanal é opt-in e todo e-mail tem link para a Política e para desligar | ✅ |

## 2. Crianças e adolescentes

| # | Risco | P | I | O que foi feito | Status |
|---|---|---|---|---|---|
| C1 | Menores usando a plataforma (art. 14 da LGPD; ECA e legislação de proteção de crianças e adolescentes no ambiente digital) | 2 | 3 | Público restrito a 18+, com declaração obrigatória no cadastro; Política prevê exclusão de contas de menores | ⚠️ a declaração não verifica a idade de fato. Se o público incluir menores (ex.: ensino médio), é preciso redesenhar o cadastro, com consentimento dos responsáveis e regras específicas |

## 3. Saúde e bem-estar

| # | Risco | P | I | O que foi feito | Status |
|---|---|---|---|---|---|
| S1 | O app ser visto como serviço de saúde ou dar orientação clínica | 1 | 3 | Termos e Política afirmam que não é serviço de saúde; nenhuma análise, diagnóstico ou recomendação a partir do humor | ✅ |
| S2 | Usuário em sofrimento sem encaminhamento | 2 | 3 | Aviso com o CVV (188) na tela de consentimento e nos documentos | ⚠️ inerente a ferramentas de bem-estar; não usar o humor para gerar alertas automáticos sem acompanhamento profissional |

## 4. Consumidor e responsabilidade civil

| # | Risco | P | I | O que foi feito | Status |
|---|---|---|---|---|---|
| R1 | Cláusulas abusivas, mesmo em serviço gratuito (CDC, art. 51) | 1 | 2 | Termos não afastam direitos legais, preveem foro do domicílio do usuário e aviso antes de encerrar o serviço | ✅ |
| R2 | Perda de dados ou indisponibilidade | 2 | 2 | Termos informam a natureza acadêmica e gratuita; backup semanal; exportação disponível; aviso prévio de encerramento | ✅ |
| R3 | Encerramento do projeto após a entrega | 3 | 1 | Termos preveem aviso prévio, exportação e apagamento dos dados | ⚠️ definir quem desliga o serviço e apaga os dados após a banca, e em que data |

## 5. Marco Civil da Internet (Lei 12.965/2014)

| # | Risco | P | I | O que foi feito | Status |
|---|---|---|---|---|---|
| M1 | Guarda de registros de acesso (art. 15) | 1 | 1 | O dever de guarda por 6 meses se aplica a provedores constituídos como pessoa jurídica com fins econômicos, o que não é o caso. Mesmo assim, guardamos IP e data por 6 meses, apenas para segurança | ✅ |
| M2 | Conteúdo ilícito inserido por usuários (art. 19) | 1 | 1 | Conteúdo é privado (não há área pública); Termos proíbem conteúdo ilegal | ✅ |

## 6. Propriedade intelectual

| # | Risco | P | I | O que foi feito | Status |
|---|---|---|---|---|---|
| P1 | Titularidade do código e da marca entre alunos e instituição (Lei 9.609/1998, Lei 9.610/1998 e regulamento da UNASP) | 2 | 2 | Termos dizem que nome, visual e código pertencem aos autores | ❌ conferir o regulamento de PI da UNASP para trabalhos acadêmicos; o repositório não tem arquivo `LICENSE` (sem ele, ninguém tem permissão de reutilizar o código) |
| P2 | Nome "StudyXP" já registrado por terceiros | 1 | 2 | — | ❌ fazer busca no INPI antes de qualquer uso fora do contexto acadêmico |
| P3 | Licenças de bibliotecas e fontes | 1 | 1 | Dependências open source com licenças permissivas (MIT, Apache 2.0, ISC); fonte Poppins sob SIL Open Font License, hospedada no próprio site; logos convertidos a partir dos arquivos do próprio time | ✅ |
| P4 | Ícones do aplicativo ainda são os padrão do Expo | 1 | 1 | Uso permitido pela licença do template | ⚠️ trocar pela identidade visual do StudyXP antes de distribuir o APK |

## 7. Acessibilidade

| # | Risco | P | I | O que foi feito | Status |
|---|---|---|---|---|---|
| A1 | Barreiras de acesso (Lei Brasileira de Inclusão — Lei 13.146/2015, art. 63; WCAG 2.1 AA como referência) | 2 | 2 | Verificação automática WCAG 2.1 AA (axe-core) em todas as telas, desktop e celular, no CI; contraste corrigido; textos alternativos nas imagens; idioma `pt-BR`; navegação por teclado | ⚠️ falta teste manual com leitor de tela (roteiro em `docs/testes/testes-manuais.md`) |

## 8. Pesquisa com pessoas (teste com usuários)

| # | Risco | P | I | O que foi feito | Status |
|---|---|---|---|---|---|
| U1 | Coletar dados de colegas no teste de usabilidade sem consentimento | 2 | 2 | Termo de consentimento do participante incluído no roteiro de UAT; respostas do SUS anônimas | ✅ |
| U2 | Publicar os resultados como pesquisa científica sem aprovação ética (Resolução CNS 510/2016 — conferir) | 1 | 2 | — | ❌ confirmar com o orientador se o relatório se enquadra como avaliação interna do produto (sem necessidade de CEP) ou como pesquisa |

## 9. Distribuição do aplicativo

| # | Risco | P | I | O que foi feito | Status |
|---|---|---|---|---|---|
| D1 | Publicar na Google Play sem os requisitos de privacidade | 1 | 2 | Fora do escopo (APK distribuído por link). Se publicar: informar a URL da Política, preencher a seção "Segurança dos dados" e oferecer exclusão de conta (já existe) | ✅ |

## 10. Prioridades antes da entrega

1. **L8:** trocar a senha do PostgreSQL.
2. **L5:** definir o e-mail do canal de privacidade e rodar `node scripts/sincronizar-legal.mjs`.
3. **P1:** conferir o regulamento de propriedade intelectual da UNASP e decidir a licença do código.
4. **U2:** confirmar com o orientador o enquadramento do teste com usuários.
5. **R3 e L9:** definir a data de desligamento do serviço e a regra para contas inativas.
