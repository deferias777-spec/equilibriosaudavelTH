# Equilíbrio Saudável — React + JSX + Tailwind + Express + Neon

Projeto inicial full-stack para Thaís Felício. Identidade rosa pastel `#FDB4BF`.

## Rodar no VS Code (PowerShell)

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run dev
```

Antes de `db:push`, edite `.env` com a URL do Neon e um `JWT_SECRET` aleatório com pelo menos 32 caracteres. Abra `http://localhost:5173`.

Para gerar um segredo no PowerShell: `[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`

## Testes e build

```powershell
npm.cmd test
npm.cmd run build
```

## Deploy Vercel

Vite no diretório raiz: build `npm run build`, output `dist`. API Express via `/api/index.js` com rewrite em `vercel.json`. Configure `DATABASE_URL`, `JWT_SECRET`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` e `APP_URL` nas variáveis da Vercel. Nunca inclua `.env` no Git.

## Status e limitações importantes

- Landing page, roteamento, UI responsiva, login, sessão HttpOnly, modelo PostgreSQL, favoritos, metas e planejamento básico estão implementados.
- Checkout Mercado Pago cria preferência real **apenas quando** `MP_ACCESS_TOKEN` e `APP_URL` estiverem configurados. Webhook valida assinatura e consulta pagamento; deve ser testado com credenciais sandbox.
- **A ativação de conta não está operacional**: é necessário integrar um provedor transacional de e-mail e emitir tokens de ativação de uso único ao comprador após aprovação. A API de cadastro exige token, mas o sistema ainda não envia tokens. Isto impede que novos clientes concluam o fluxo de forma automática.
- Renovação de contas existentes, recuperação de senha, lista de compras, painel administrativo completo, CRUD de receitas, auditoria, política de privacidade e termos ainda não estão implementados.
- As **60 entradas de receitas são 20 preparações-base com 2 variações simples cada**, não 60 preparações culinárias independentes. Fotos são referências externas provisórias e podem não corresponder exatamente a cada prato. Revisar conteúdo, imagens, quantidades e segurança alimentar antes de vender.
- Este pacote é uma **base de desenvolvimento**, NÃO está pronto para aceitar pagamentos de clientes reais ou ser anunciado como produto final. Teste segurança, webhooks, rotas, recuperação e deploy antes de produção.
- Caso o GitHub já contenha um projeto, crie um branch ou backup antes de substituir arquivos.
