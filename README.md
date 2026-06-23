# InstaContact AI

Extrator inteligente de contatos do Instagram Business via RapidAPI — SaaS de lead generation com orquestração multi-endpoint, fallback inteligente, enriquecimento e export multiformato.

## Stack

- **Next.js 16** (App Router) + Tailwind CSS v4 + TypeScript
- **RapidAPI Hub** — orquestração de múltiplos endpoints de Instagram
- **Node.js** runtime (API routes)
- Build com Turbopack

## Funcionalidades (MVP)

- Input multi-formato: usernames, URLs, hashtags, keywords, CSV
- Orquestração de 5+ endpoints RapidAPI com fallback inteligente e circuit breaker
- Extração: e-mail, WhatsApp, bio, categoria, seguidores, link, isBusiness
- Enriquecimento: validação de e-mail, detecção de WhatsApp (wa.me/bio), lead score 0–100
- Outputs: Excel (XLSX), CSV, JSON, Notion (markdown), Webhook assinado
- Dashboard de performance por endpoint (sucesso, custo, latência, contatos)
- Gerenciamento de créditos e billing
- Banner de conformidade LGPD + Termos Instagram

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

### Variáveis de ambiente

```bash
# Opcional — sem chave, o app usa mock data para demo
RAPIDAPI_KEY=your_rapidapi_key
```

## Scripts

| Script | Descrição |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm start` | Servidor de produção |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript sem emit |

## Documentação

Veja `PRD_InstaContact_AI.md` para o Product Requirements Document completo.

## Conformidade

O InstaContact AI coleta apenas **dados públicos** via APIs do RapidAPI. O uso dos dados é de responsabilidade do usuário final, conforme a LGPD (Lei 13.709/2018) e os Termos do Instagram.
