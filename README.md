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