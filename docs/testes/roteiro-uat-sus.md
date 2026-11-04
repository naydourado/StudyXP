# Teste de Aceitação com Usuários (UAT) e Questionário SUS

**Quando:** homologação, 21 a 27/11/2026 · **Participantes:** 8 a 10 colegas que não participaram do desenvolvimento
**Meta:** nenhum defeito bloqueante e nota SUS média **≥ 70**

## 1. Preparação

- [ ] Site e API publicados e "acordados" (abrir o `/api/v1/health` alguns minutos antes).
- [ ] APK instalado em pelo menos 2 celulares Android para quem testar no app.
- [ ] Uma pessoa da equipe por sessão, só observando e anotando (não ajudar, a não ser que a pessoa trave por mais de 2 minutos).
- [ ] Formulário do SUS pronto (Google Forms ou papel).
- [ ] Explicar ao participante: o teste é do sistema, não da pessoa; pode pensar em voz alta; os dados criados são de teste e a conta será excluída ao final.
- [ ] Ler o **termo de consentimento** (seção 1.1) e só começar depois do "aceito" (assinatura ou marcação no formulário).
- [ ] Usar e-mail fictício no cadastro (ex.: `p1@teste.studyxp.dev`), para não guardar o e-mail real do participante.
- [ ] Não registrar humor real: na tarefa 5, a pessoa pode escolher qualquer opção.

### 1.1 Termo de consentimento do participante

> Você está sendo convidado(a) a testar o **StudyXP**, aplicativo desenvolvido como Projeto Integrador do curso no UNASP-HT, pela equipe Brunno Denadai, Emily Modro, Gabriel Rossik, Isabela Rosa e Nayra Dourado.
>
> **Objetivo:** avaliar se o sistema é fácil de usar. Quem está sendo avaliado é o sistema, não você.
>
> **Como funciona:** você fará 10 tarefas curtas (cerca de 15 minutos) e responderá a um questionário de 10 frases. Uma pessoa da equipe vai observar e anotar se a tarefa foi concluída, o tempo e as dificuldades. **Não há gravação de áudio, vídeo ou tela.**
>
> **Dados:** não pedimos seu nome no questionário; você será identificado(a) só por um código (P1, P2...). Use um e-mail fictício no cadastro; a conta de teste e tudo o que foi criado nela serão excluídos ao final da sessão. Não registre informações reais sobre seu humor. As respostas serão usadas apenas de forma agregada (médias) no relatório e na apresentação do projeto, e as anotações serão descartadas após a avaliação final da disciplina.
>
> **Participação voluntária:** você pode desistir a qualquer momento, sem precisar explicar o motivo e sem nenhuma consequência (inclusive em notas ou na relação com a equipe). Se desistir, suas respostas serão descartadas.
>
> **Requisitos:** ter 18 anos ou mais.
>
> **Dúvidas:** fale com a equipe ou pelo canal de privacidade informado na Política de Privacidade do StudyXP.
>
> ☐ Tenho 18 anos ou mais, li este termo e aceito participar.
>
> Código do participante: ______ Data: ___/___/2026

Se o grupo pretender publicar os resultados como pesquisa (artigo, evento científico), confirme antes com o orientador se é preciso submeter ao Comitê de Ética em Pesquisa (ver `docs/lgpd/riscos-juridicos.md`, item U2).

## 2. Tarefas para o participante

Ler cada tarefa em voz alta, sem explicar como fazer. Anotar: concluiu (sim/não/com ajuda), tempo aproximado e dificuldades.

| # | Tarefa | Critério de sucesso |
|---|---|---|
| 1 | Crie uma conta no StudyXP | Chega ao Dashboard |
| 2 | Crie a tarefa "Estudar para a prova de Redes", prioridade alta, para amanhã | Tarefa aparece em Pendentes com "Amanhã · Alta" |
| 3 | Marque essa tarefa como concluída | XP sobe 80 e a tarefa vai para Concluídas |
| 4 | Comece uma sessão de foco de 25 minutos, pause e depois resete | Timer pausa e volta para 25:00 |
| 5 | Registre como você está se sentindo hoje, com uma nota | Registro aparece no histórico (após autorizar) |
| 6 | Descubra quantas tarefas você concluiu nesta semana | Encontra a tela de Progresso e o gráfico |
| 7 | Veja quais conquistas você já tem | Encontra a lista de conquistas no Perfil |
| 8 | Desligue o resumo semanal por e-mail | Interruptor desligado em Configurações |
| 9 | Baixe uma cópia dos seus dados | Arquivo exportado |
| 10 | Exclua sua conta | Volta para a tela de login e não consegue mais entrar |

## 3. Questionário SUS (System Usability Scale)

Aplicar logo após as tarefas. Cada frase com nota de 1 (discordo totalmente) a 5 (concordo totalmente):

1. Eu acho que gostaria de usar o StudyXP com frequência.
2. Eu achei o StudyXP desnecessariamente complexo.
3. Eu achei o StudyXP fácil de usar.
4. Eu acho que precisaria de ajuda de uma pessoa com conhecimentos técnicos para usar o StudyXP.
5. Eu achei que as várias funções do StudyXP estão bem integradas.
6. Eu achei que o StudyXP apresenta muita inconsistência.
7. Eu imagino que a maioria das pessoas aprenderia a usar o StudyXP rapidamente.
8. Eu achei o StudyXP muito complicado de usar.
9. Eu me senti confiante ao usar o StudyXP.
10. Eu precisei aprender várias coisas antes de conseguir usar o StudyXP.

Perguntas abertas (opcionais): O que você mais gostou? O que mais atrapalhou? Usaria no seu dia a dia?

### Como calcular a nota

Para cada participante:

- Frases **ímpares** (1, 3, 5, 7, 9): nota − 1
- Frases **pares** (2, 4, 6, 8, 10): 5 − nota
- Some os 10 resultados e multiplique por **2,5** → nota de 0 a 100

Exemplo: respostas 4,2,5,1,4,2,5,1,4,2 → (3+3+4+4+3+3+4+4+3+3) = 34 × 2,5 = **85**.

A nota do sistema é a **média** dos participantes. Referência usual: 68 é a média de mercado; acima de 80 é considerado muito bom.

## 4. Registro dos resultados

| Participante | Web ou app | Tarefas concluídas sem ajuda | Nota SUS | Principais dificuldades |
|---|---|---|---|---|
| P1 | | /10 | | |
| P2 | | /10 | | |
| ... | | | | |
| **Média** | | | | |

## 5. Depois do teste

- Abrir uma issue para cada problema encontrado, com severidade: **bloqueante**, **alta**, **média**, **baixa**.
- Corrigir os bloqueantes e os de severidade alta antes da entrega (30/11).
- Levar a média SUS e os principais aprendizados para o relatório final e os slides.
