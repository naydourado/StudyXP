# Arquitetura do Sistema — StudyXP

## Visão Geral

O StudyXP foi desenvolvido como uma aplicação web baseada em arquitetura cliente-servidor.

O sistema é dividido em três camadas principais:

- Front-end
- Back-end
- Banco de Dados

Essa separação permite maior organização, manutenção e escalabilidade do projeto.

---

## Estrutura Geral

```txt
React (Front-end)
        ↓
FastAPI (Back-end)
        ↓
MySQL (Banco de Dados)
```

---

## Front-end

O front-end será desenvolvido utilizando React + Vite.

Responsabilidades:

- Interface gráfica
- Navegação entre páginas
- Consumo da API
- Controle de autenticação no cliente
- Experiência do usuário

---

## Back-end

O back-end foi desenvolvido utilizando FastAPI.

Responsabilidades:

- API REST
- Regras de negócio
- Autenticação JWT
- Processamento dos dados
- Integração com banco

---

## Banco de Dados

O sistema utiliza MySQL.

Responsabilidades:

- Persistência de dados
- Relacionamentos
- Integridade das informações

---

## Arquitetura Modular

O sistema utiliza organização modular por funcionalidades.

Principais módulos:

- Usuários/Auth
- Tarefas
- Dashboard
- Humor
- Foco

Essa abordagem reduz acoplamento e melhora manutenção e divisão do desenvolvimento.