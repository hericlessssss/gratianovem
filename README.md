# Gratianovem

Aplicação web para Novenas e Testemunhos, construída com tecnologias de frontend e backend-as-a-service.

## 🛠 Tech Stack

### Frontend Core
- **[React 18](https://reactjs.org/)** - Biblioteca principal para construção da interface.
- **[TypeScript](https://www.typescriptlang.org/)** - Superset JavaScript para tipagem estática e segurança no desenvolvimento.
- **[Vite](https://vitejs.dev/)** - Build tool e dev server ultra-rápido.

### Estilização & UI
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first.
- **[shadcn/ui](https://ui.shadcn.com/)** - Coleção de componentes reutilizáveis baseados no Radix UI.
- **[Radix UI](https://www.radix-ui.com/)** - Primitivos de UI acessíveis e sem estilo (Headless UI).
- **[Lucide React](https://lucide.dev/)** - Biblioteca de ícones.
- **[Next Themes](https://github.com/pacocoursey/next-themes)** - Gerenciamento de temas (Dark/Light mode).

### Data fetching & State Management
- **[React Query (@tanstack/react-query)](https://tanstack.com/query/latest)** - Gerenciamento de estado assíncrono e cache de dados.
- **React Context API** - Gerenciamento de estado global simples (ex: Autenticação).

### Roteamento
- **[React Router DOM](https://reactrouter.com/)** - Roteamento client-side.

### Backend & Integrações
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (PostgreSQL, Auth, Storage, Realtime).

### Formulários & Validação
- **[React Hook Form](https://react-hook-form.com/)** - Gerenciamento de formulários performático.
- **[Zod](https://zod.dev/)** - Biblioteca de validação de schemas TypeScript.

### Outras Bibliotecas Notáveis
- **@dnd-kit** - Funcionalidades de Drag and Drop.
- **Recharts** - Biblioteca de gráficos composta.
- **Sonner** - Notificações toast.
- **date-fns** - Manipulação de datas.

## 🚀 Como Executar

### Pré-requisitos
- Node.js (versão LTS recomendada)
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as credenciais do Supabase:
```env
VITE_SUPABASE_URL=url_do_supabase
VITE_SUPABASE_ANON_KEY=anon_key_do_supabase
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:8080` (ou outra porta indicada no terminal).

## 📂 Estrutura do Projeto

```
src/
├── components/     # Componentes de UI reutilizáveis (botões, inputs, cards)
│   └── ui/         # Componentes base do shadcn/ui
├── contexts/       # Contextos do React (ex: AuthContext)
├── hooks/          # Custom Hooks (ex: use-toast)
├── integrations/   # Configuração de clientes de API (Supabase)
├── lib/            # Utilitários e helpers (ex: utils.ts para cn())
├── pages/          # Páginas da aplicação (rotas)
│   ├── admin/      # Páginas da área administrativa
│   └── ...         # Páginas públicas (Index, Novenas, Auth, etc.)
├── App.tsx         # Componente raiz e definição de rotas
└── main.tsx        # Ponto de entrada da aplicação
```

## ✨ Funcionalidades Principais

- **Sistema de Novenas**: Visualização detalhada de novenas, com progresso diário.
- **Testemunhos**: Espaço para usuários compartilharem e lerem graças alcançadas.
- **Autenticação**: Login e Registro de usuários via Supabase Auth.
- **Painel Administrativo**:
  - Dashboard geral.
  - CRUD de Novenas (Criação e Edição).
  - Moderação de Testemunhos.
- **Responsividade**: Layout adaptável para dispositivos móveis e desktop.

## 📧 Configuração de Email (SMTP)

A aplicação está preparada para enviar lembretes por email utilizando um servidor SMTP (como Gmail). Para ativar essa funcionalidade, você precisará configurar uma **Supabase Edge Function** e definir as credenciais.

### 1. Configurar Gmail (ou outro provedor)
Se for utilizar o Gmail, você precisa gerar uma "Senha de App" (App Password), pois a senha normal não funciona para SMTP.
1. Acesse sua conta Google -> Segurança.
2. Ative a "Verificação em duas etapas" (se não estiver ativa).
3. Busque por "Senhas de App".
4. Crie uma nova senha (ex: "Gratianovem App") e copie a senha gerada (ex: `xxxx xxxx xxxx xxxx`).

### 2. Deploy da Função
O código da função de envio está em `supabase/functions/send-email`. Você precisa fazer o deploy dela para o Supabase.

No terminal, execute:
```bash
npx supabase functions deploy send-email --no-verify-jwt
```
> **Nota:** O deploy requer que você esteja logado no Supabase CLI (`npx supabase login`) e tenha o projeto linkado (`npx supabase link --project-ref <seu-project-id>`).

### 3. Definir Variáveis de Ambiente (Segredos)
Configure as credenciais do email no Supabase para que a função possa acessá-las. **NUNCA** coloque essas senhas no código ou no `.env` do frontend.

No terminal:
```bash
npx supabase secrets set SMTP_USER="seu-email@gmail.com"
npx supabase secrets set SMTP_PASS="sua-senha-de-app-aqui"
```

### 4. Automatização (Cron Job)
Para enviar os lembretes automaticamente (ex: todo dia às 20h), você deve configurar um Cron Trigger no Supabase.

1.  Habilite as extensões `pg_cron` e `pg_net` no Dashboard do Supabase (Database -> Extensions).
2.  Ou execute o comando SQL: `create extension if not exists pg_net; create extension if not exists pg_cron;`
3.  Execute o seguinte SQL no SQL Editor do Supabase:

```sql
select
  cron.schedule(
    'reminders-daily-20h', -- nome do job
    '0 20 * * *',          -- cron expression (20:00 UTC)
    $$
    select
      net.http_post(
        url:='https://<seu-project-ref>.supabase.co/functions/v1/process-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer <sua-service-role-key>"}'::jsonb
      ) as request_id;
    $$
  );
```
> **Atenção:** Substitua `<seu-project-ref>` e `<sua-service-role-key>` pelos valores corretos do seu projeto. Você pode encontrar a Service Role Key em Project Settings -> API.

### 5. Deploy da Função de Lembretes
Esta função (`process-reminders`) contém a lógica inteligente que verifica quem não rezou hoje.

Deploy:
```bash
npx supabase functions deploy process-reminders --no-verify-jwt
```
E certifique-se de que os segredos `SMTP_USER`, `SMTP_PASS`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estejam definidos no Supabase.

```bash
npx supabase secrets set SUPABASE_URL="sua-url"
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="sua-key"
```
*(Nota: As funções do Supabase geralmente já têm acesso a essas variáveis, mas é bom garantir ou usar `Deno.env.get('SUPABASE_URL')` se disponível por padrão)*.
