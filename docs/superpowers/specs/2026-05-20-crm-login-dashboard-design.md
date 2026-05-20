# CRM Dashboard com Login — Design Spec

**Data:** 2026-05-20  
**Status:** Aprovado

---

## Visão Geral

Sistema web de uso pessoal (usuário único) composto por uma tela de login e um dashboard de CRM com gestão de clientes e pipeline de vendas em formato Kanban.

---

## Stack Tecnológica

- **Framework:** Next.js 14 (App Router)
- **Autenticação e Banco de Dados:** Supabase (Auth + PostgreSQL)
- **Estilização:** Tailwind CSS
- **Componentes UI:** shadcn/ui
- **Linguagem:** TypeScript

---

## Arquitetura

Aplicação fullstack em repositório único com Next.js App Router. O Supabase gerencia autenticação via email e senha. O middleware do Next.js protege todas as rotas exceto `/login`, redirecionando usuários não autenticados.

O usuário único é criado manualmente no painel do Supabase — não há tela de cadastro pública.

### Páginas

| Rota | Descrição |
|---|---|
| `/login` | Tela de login (email + senha) |
| `/` | Dashboard com métricas gerais |
| `/clients` | Gestão de clientes (CRUD) |
| `/pipeline` | Board Kanban de pipeline de vendas |

### Navegação

Sidebar lateral fixa com links para Dashboard, Clientes e Pipeline, mais botão de logout.

---

## Modelo de Dados

### Tabela `clients`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Chave primária |
| `name` | text | Nome do cliente |
| `email` | text | Email |
| `phone` | text | Telefone |
| `company` | text | Empresa |
| `notes` | text | Observações livres |
| `created_at` | timestamptz | Data de criação |

### Tabela `deals`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Chave primária |
| `client_id` | uuid | FK para `clients.id` |
| `title` | text | Título do negócio |
| `value` | numeric | Valor em R$ |
| `stage` | text (enum) | Etapa do pipeline |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Data da última atualização |

**Valores válidos para `stage`:** `prospeccao`, `qualificacao`, `proposta`, `negociacao`, `fechado`

Um cliente pode ter múltiplos negócios.

---

## Funcionalidades

### Login (`/login`)
- Formulário centralizado com campos de email e senha
- Autenticação via Supabase Auth
- Redirecionamento para `/` após login bem-sucedido
- Exibição de mensagem de erro em caso de credenciais inválidas

### Dashboard (`/`)
Quatro cards de métricas:
1. Total de clientes cadastrados
2. Total de negócios ativos (não fechados)
3. Valor total do pipeline (soma dos deals em aberto)
4. Negócios fechados no mês atual

### Clientes (`/clients`)
- Tabela listando todos os clientes com colunas: Nome, Empresa, Email, Telefone
- Botão para adicionar novo cliente (modal ou página)
- Ações por linha: editar e remover
- Confirmação antes de remover

### Pipeline (`/pipeline`)
- Board Kanban com 5 colunas: Prospecção, Qualificação, Proposta, Negociação, Fechado
- Cada card exibe: título do negócio, nome do cliente vinculado e valor (R$)
- Arrastar card entre colunas atualiza o `stage` no banco
- Botão para criar novo negócio (vinculando a um cliente existente)
- Ação de editar e remover deal por card

### Logout
- Botão na sidebar encerra sessão Supabase e redireciona para `/login`

---

## Segurança

- Middleware Next.js verifica sessão Supabase em todas as rotas protegidas
- Row Level Security (RLS) habilitado no Supabase para as tabelas `clients` e `deals`
- Sem rota de cadastro pública — acesso restrito ao usuário criado manualmente

---

## Fora do Escopo

- Múltiplos usuários / multi-tenant
- Notificações ou e-mails automáticos
- Relatórios e exportação de dados
- Integração com sistemas externos
