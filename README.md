# Gratia Novem

**Gratia Novem** é uma aplicação web dedicada à prática de novenas e compartilhamento de testemunhos (por enquanto). Concebida para oferecer uma experiência espiritual profunda, a plataforma possui funcionalidades robustas de acompanhamento devocional.

![Gratia Novem Preview](https://placehold.co/1200x600/f6f5f2/D4AF37?text=Gratia+Novem)

## Funcionalidades

A aplicação foi desenvolvida pensando na jornada do católico digital, que muitas vezes se perde tanto na constância na oração quanto na qualidade do conteúdo.

- **Sistema de Novenas:** 
  - Acompanhamento diário de orações com checklists.
  - Conteúdo rico e formatado (orações, meditações, jaculatórias).
  - Lógica de bloqueio/desbloqueio progressivo de dias.
  
- **Testemunhos de Graças:**
  - Espaço comunitário para leitura e envio de testemunhos.
  - Sistema de "Velas" (likes) para interação respeitosa.

- **Perfil do usuário:**
  - Histórico completo de novenas realizadas.
  - Sincronização em nuvem (Cross-device).
  - Opções de privacidade e "Modo Silencioso".
  - Exportação de Dados: Download completo do histórico do usuário.
  - Exclusão de Conta: Controle total sobre os próprios dados.

- **Notificações:**
  - Emails automáticos de início e conclusão de jornada.
  - Lembretes diários para manter a constância na oração.

## Tecnologias

Construído com um stack moderno focado em performance, acessibilidade e experiência do desenvolvedor:

### Frontend
- **[React 18](https://reactjs.org/)** & **[TypeScript](https://www.typescriptlang.org/)**
- **[Vite](https://vitejs.dev/)** - Tooling de nova geração.
- **[Tailwind CSS](https://tailwindcss.com/)** - Estilização utility-first.
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes de interface acessíveis.
- **[Tiptap](https://tiptap.dev/)** - Editor de texto rico (Rich Text) headless para exibição fluida de conteúdo.
- **[Framer Motion](https://www.framer.com/motion/)** - Animações declarativas e fluidas.

### Backend & Serviços
- **[Supabase](https://supabase.com/)** - Poderosa suíte Backend-as-a-Service:
  - **PostgreSQL**: Banco de dados relacional robusto.
  - **Auth**: Autenticação segura (Email/Senha e Anônima).
  - **Edge Functions**: Lógica serverless para emails e cron jobs.
  - **Realtime**: Sincronização de dados em tempo real.

---

<div align="center">
  <p><i>"Comece fazendo o que é necessário, depois o que é possível, e de repente você estará fazendo o impossível."</i></p>
  <p><b>— São Francisco de Assis</b></p>
</div>
