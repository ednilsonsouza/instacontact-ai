# Product Requirements Document (PRD)
## InstaContact AI — Extrator Inteligente de Contatos do Instagram Business via RapidAPI

| Campo | Valor |
|---|---|
| **Produto** | InstaContact AI |
| **Versão do documento** | 1.0 |
| **Data** | 23/06/2026 |
| **Owner** | Product Management |
| **Status** | Draft para validação técnica e de negócio |
| **Stack principal** | Next.js 15 · Node.js · Supabase · RapidAPI Hub |
| **Tipo** | SaaS B2B — Growth Hacking / Lead Generation |

---

## 1. Visão Geral e Objetivos

### 1.1 Contexto do problema
Equipes de growth, vendas e marketing precisam construir listas de leads qualificados de perfis Instagram Business/Creator (maquiadores, personal trainers, advogados, restaurantes, clínicas, e-commerces) para campanhas de outreach (e-mail, WhatsApp, CRM). A coleta manual é inviável em escala, e as ferramentas existentes são **instáveis, caras, opacas ou sujeitas a banimentos**.

### 1.2 Proposta de valor
O **InstaContact AI** é um SaaS que, a partir de uma única interface, **orquestra múltiplas APIs de Instagram disponíveis no RapidAPI Hub**, testa automaticamente qual retorna mais contatos por perfil, faz **fallback inteligente** entre endpoints, **enriquece e valida** os dados (e-mail válido, WhatsApp `wa.me` válido, scoring de lead) e entrega em **Excel/CSV/JSON/Google Sheets/Notion/Webhook/CRM**.

### 1.3 Objetivos do produto
| # | Objetivo | Meta mensurável (MVP) |
|---|---|---|
| O1 | Maximizar taxa de extração de e-mail público | ≥ 40% combinado |
| O2 | Maximizar taxa de extração de WhatsApp | ≥ 28% combinado |
| O3 | Reduzir custo por lead | Competitivo vs. scraping manual e ferramentas pagas |
| O4 | Garantir velocidade | < 6 s por perfil (média) |
| O5 | Oferecer transparência | Dashboard com taxa de sucesso, custo e latência por endpoint |
| O6 | Mitigar risco de banimento | Rate limiting + rotação de endpoints + proxy opcional |

### 1.4 Não objetivos (MVP)
- Não enviar e-mails nem mensagens WhatsApp (apenas extração/enriquecimento).
- Não armazenar credenciais de usuários do Instagram.
- Não fazer scraping fora de RapidAPI no MVP.
- Não substituir um CRM; integra-se a eles.

---

## 2. Personas de Usuário

| Persona | Perfil | Principal dor | O que espera do produto |
|---|---|---|---|
| **Growth Lead (Ana)** | Head of Growth em startups B2B/B2C | Listas frias caras e genéricas | Leads de nicho validados, prontos para outreach |
| **SDR (Bruno)** | Rep de vendas outbound | Perde horas extraindo contatos manualmente | Upload de CSV → export em Excel em 1 clique |
| **Agência de Marketing (Carla)** | Dona de agência SM/tráfego | Clientes pedem listas segmentadas por nicho/local | Busca por nicho + filtros + export para Sheets/Notion |
| **Revendedor/Infoprodutor (Diego)** | Dono de curso de marketing | Precisa de listas para seus alunos | Export em massa + webhook para Make/n8n |
| **Dev/RevOps (Eliane)** | Engenheira que conecta ao CRM | APIs instáveis e rate limits confusos | Webhook robusto, logs, schema JSON estável |

---

## 3. Funcionalidades (priorização MoSCoW)

### 3.1 MVP — Fase 1

#### Must Have
| ID | Funcionalidade | Descrição |
|---|---|---|
| M1 | **Input multi-formato** | Lista de usernames, URLs de perfis, hashtags, locais, palavras-chave ou upload de CSV (até 10k linhas) |
| M2 | **Orquestração RapidAPI multi-endpoint** | Chamada simultânea/sequencial a ≥3 APIs de Instagram do RapidAPI, com fallback automático |
| M3 | **Fallback inteligente** | Seleção dinâmica do endpoint que retornou dados mais completos por perfil; cache de decisão por categoria |
| M4 | **Extração obrigatória** | E-mail público (bio, contact button, enriquecimento), Telefone/WhatsApp (contact button, bio, `wa.me`), nome completo, username, bio completa, categoria do negócio, seguidores, following, posts, verificado, isBusiness, link na bio |
| M5 | **Enriquecimento e validação** | Validação SMTP/sintaxe de e-mail, detecção de WhatsApp válido (regex `wa.me`, formatos BR/INTL), scoring de qualidade do lead (0–100) |
| M6 | **Outputs múltiplos** | Excel (.xlsx), CSV, JSON, Google Sheets, Notion, Webhook (POST assinado) |
| M7 | **Gerenciamento de créditos/custos** | Contador em tempo real de créditos consumidos por endpoint RapidAPI e custo $ por usuário |
| M8 | **Rate limiting por endpoint** | Respeitar limites declarados de cada API; fila com backoff exponencial |
| M9 | **Autenticação e billing** | Login (Clerk ou Supabase Auth), planos por créditos/mês, stripe billing |
| M10 | **Logs e erros por endpoint** | Histórico por request com status, payload resumido, erro, latência |
| M11 | **Aviso de conformidade** | Banner LGPD + Termos Instagram; opt-in do usuário |

#### Should Have
| ID | Funcionalidade | Descrição |
|---|---|---|
| S1 | **Preview de resultados** | Tabela paginada antes do download final |
| S2 | **Dedup automática** | Por username e por e-mail/WhatsApp normalizado |
| S3 | **Tags e segmentação** | Atribuir tags por batch (ex: "maquiadora-sp") |
| S4 | **Proxy/rotação opcional** | Configuração de proxy HTTP residencial para reduzir bloqueios |
| S5 | **Dashboard de performance por API** | Taxa de sucesso, custo por lead, latência média |

#### Could Have
| ID | Funcionalidade | Descrição |
|---|---|---|
| C1 | **Comparação lado-a-lado de APIs** | Tabela mostrando o que cada endpoint retornou para o mesmo perfil |
| C2 | **API pública do InstaContact** | Cliente pode chamar nossa orquestração via REST |
| C3 | **Extensão de navegador** | Extrair da página de perfil visitada |

#### Won't Have (MVP)
- Envio de campanhas (e-mail/WhatsApp).
- Login OAuth com Instagram do usuário final.
- Scraping fora do RapidAPI.

### 3.2 Fase 2
| ID | Funcionalidade | Descrição |
|---|---|---|
| F2-1 | **Busca por nicho** | Query natural ("maquiadora sp", "personal trainer rio") → lista de usernames candidatos |
| F2-2 | **Filtros avançados** | Seguidores (min/max), engajamento, localização, keywords na bio, isBusiness, verificado |
| F2-3 | **Comparação automática multi-API** | Ranking automático de melhor endpoint por categoria de perfil |
| F2-4 | **Workflows de automação** | Integrações nativas Make.com, n8n, Zapier |
| F2-5 | **CRMs** | Hubspot, Pipedrive, RD Station, ActiveCampaign |
| F2-6 | **Dashboard de performance avançado** | Custo por lead, taxa de bounce estimada, ROI |

### 3.3 Fase 3 (exploratória)
- Enriquecimento com LinkedIn/CNPJ/Receita.
- Detecção de persona via IA (GPT-4o-mini) sobre a bio.
- Validação de e-mail em tempo real via SMTP ping.
- WhatsApp presence check (com consentimento).
- Marketplace de templates de outreach.

---

## 4. User Flows / Jornada do Usuário

### 4.1 Fluxo principal — Extração em lote
```
[Login] → [Dashboard]
   → [Nova Extração]
      → [Input: colar usernames / upload CSV / hashtag / local / keyword]
      → [Configurações: endpoints a usar, filtros básicos, outputs desejados]
      → [Estimativa de custo (créditos + $) — mostrar antes de rodar]
      → [Execução assíncrona com barra de progresso + live results]
         → Orquestrador escolhe endpoint por perfil (fallback)
         → Enriquecimento + validação + scoring
      → [Preview em tabela]
      → [Export: Excel/CSV/JSON/Sheets/Notion/Webhook]
      → [Salvo no histórico do usuário]
```

### 4.2 Fluxo de fallback
```
Para cada perfil P:
  1. Endpoint prioritário (definido por categoria/history)
  2. Se faltar e-mail OU whatsapp → tentar endpoint secundário
  3. Se ainda incompleto → endpoint terciário
  4. Combinar resultados (merge por campo, priorizar fonte com maior score histórico)
  5. Se todos falharem → marcar P como "no_contact_found" com motivo
```

### 4.3 Fluxo de billing
```
[Planos Free/Pro/Business] → créditos mensais
   → cada request consome créditos conforme custo real do endpoint
   → alerta em 80% e 95% do limite
   → opção de top-up ou upgrade
```

---

## 5. Integrações com RapidAPI

### 5.1 Endpoints recomendados (validar disponibilidade e ToS no launch)
| Endpoint (RapidAPI) | Foco | Prioridade |
|---|---|---|
| Instagram Email Scraper | E-mail público em bio/contact button | P0 |
| Instagram Email Contact Finder | Descoberta de e-mail por username | P0 |
| Website Contacts Scraper | Contatos a partir do link na bio | P1 |
| Instagram Scraper (Stable) | Dados de perfil completos (followers, bio, categoria) | P0 |
| Instagram Hashtag / Location API | Descoberta de usernames por hashtag/local | P1 |
| Instagram Profile Info | Snapshot leve de perfil | P2 (cache) |

> A chave única do RapidAPI simplifica autenticação, mas cada endpoint tem **pricing, rate limit e qualidade próprios** — o orquestrador deve tratar cada um como serviço independente.

### 5.2 Estratégia de fallback inteligente
1. **Catálogo de endpoints** com metadados: capacidades, custo/req, rate limit, score histórico de completude por categoria.
2. **Decisão por perfil**: usa histórico recente (ex: últimas 100 reqs) para escolher o endpoint primário com maior expectativa de completude para aquela categoria.
3. **Merge de resultados**: se endpoint A retornou bio+followers mas sem e-mail, e endpoint B retornou e-mail → combinar.
4. **Circuit breaker**: endpoint com >30% de falhas em 5 min é pausado por 10 min.
5. **Custo-efetividade**: se dois endpoints retornam igual, escolher o mais barato.
6. **Cache**: perfil consultado há <24h é reutilizado (configurável).

### 5.3 Tratamento de erros por endpoint
| Erro | Ação |
|---|---|
| 429 Rate limit | Backoff exponencial + fila |
| 401/403 Chave inválida | Alertar admin, pausar endpoint |
| 404 Perfil inexistente | Marcar `not_found` |
| 200 payload vazio | Tentar próximo endpoint |
| Timeout (>10s) | Cancelar + próximo endpoint |
| 5xx upstream | Retry até 2x, depois fallback |

---

## 6. Requisitos Técnicos e Arquitetura

### 6.1 Stack
| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind + shadcn/ui |
| Backend | Node.js (Fastify ou Next API routes) — workers em BullMQ |
| Banco | Supabase (Postgres) + Row Level Security |
| Auth | Clerk ou Supabase Auth |
| Storage | Supabase Storage + S3 (para arquivos exportados) |
| Fila | Redis (BullMQ) para jobs de extração |
| Orquestração RapidAPI | Serviço dedicado com client unificado + circuit breaker |
| Monitoring | Sentry + logs estruturados (pino) |
| Billing | Stripe |
| Analytics | Posthog |

### 6.2 Arquitetura de alto nível
```
[Next.js Web App]
        │
        ├── Auth (Clerk/Supabase)
        ├── API Gateway (Next API/Fastify)
        │       ├── Jobs Controller → [BullMQ Queue] → [Workers]
        │       │                                          │
        │       │                              [RapidAPI Orchestrator]
        │       │                                  ├── Endpoint A
        │       │                                  ├── Endpoint B
        │       │                                  └── Endpoint C
        │       ├── Enrichment Service (email validate, wa.me check, scoring)
        │       ├── Export Service (xlsx, csv, json, sheets, notion, webhook)
        │       └── Billing/Credits Service
        ├── Supabase Postgres (users, jobs, results, endpoints_stats, credits)
        └── Supabase Storage / S3 (exports)
```

### 6.3 Requisitos não funcionais
| Categoria | Requisito |
|---|---|
| Performance | < 6s por perfil (média); concorrência de N workers configurável |
| Escalabilidade | Suportar milhares de perfis/dia por tenant; jobs paginados |
| Disponibilidade | 99.5% SLA no MVP; degradação graciosa (endpoint down → fallback) |
| Segurança | RLS no Supabase; chaves RapidAPI no Vault/KMS; webhook assinado HMAC |
| Observabilidade | Sentry + logs pino + dashboard de custos por endpoint/usuário |
| Conformidade | Banner LGPD; ToS Instagram; opt-in; retenção configurável de dados |
| UX | Interface para não-técnicos; estimativa de custo antes de rodar |
| Rate limiting | Por endpoint RapidAPI + por usuário (plano) |

---

## 7. Schema de Input e Output

### 7.1 Input — exemplo JSON
```json
{
  "job": {
    "name": "Maquiadoras SP - Lote 1",
    "source": {
      "type": "usernames",
      "items": ["@makeup_bia", "@studio.linda", "@beatycorner"]
    },
    "options": {
      "endpoints": ["auto"],
      "enrichment": { "validate_email": true, "check_whatsapp": true, "lead_score": true },
      "filters": { "is_business": true, "min_followers": 1000 },
      "dedup": true,
      "cache_ttl_hours": 24
    },
    "outputs": ["xlsx", "json", "google_sheets", "webhook"],
    "webhook_url": "https://hooks.example.com/instacontact",
    "tags": ["maquiadora", "sp"]
  }
}
```

### 7.2 Output — exemplo JSON (um perfil)
```json
{
  "username": "makeup_bia",
  "full_name": "Bianca Souza Makeup",
  "bio": "Maquiadora profissional | São Paulo | Agende: WhatsApp 11 91234-5678",
  "category": "Makeup Artist",
  "is_business": true,
  "is_verified": false,
  "followers": 12450,
  "following": 890,
  "posts": 412,
  "bio_link": "https://linktr.ee/makeupbia",
  "email": {
    "value": "contato@makeupbia.com.br",
    "source": "contact_button",
    "valid": true,
    "confidence": 0.95
  },
  "whatsapp": {
    "value": "5511912345678",
    "wa_me": "https://wa.me/5511912345678",
    "source": "bio_regex",
    "valid_format": true,
    "country": "BR"
  },
  "lead_score": 82,
  "sources_used": ["instagram_scraper_stable", "instagram_email_finder"],
  "errors": [],
  "extracted_at": "2026-06-23T14:22:10Z",
  "cost_cents": 3
}
```

### 7.3 Output Excel/CSV — colunas
`username, full_name, category, is_business, is_verified, followers, following, posts, bio, bio_link, email, email_valid, whatsapp, whatsapp_valid, wa_me_link, lead_score, source_endpoints, extracted_at, cost_cents`

---

## 8. Métricas, KPIs e Monitoramento de Custos

### 8.1 KPIs de produto
| KPI | Meta MVP | Como medir |
|---|---|---|
| Taxa extração de e-mail | ≥ 40% | perfis com email_valid / total processado |
| Taxa extração de WhatsApp | ≥ 28% | perfis com whatsapp_valid / total |
| Tempo médio por perfil | < 6 s | latência p50 do job |
| Custo por lead | competitivo | $ total / leads válidos |
| Retenção (D30) | ≥ 35% | cohort de usuários ativos |
| NPS | ≥ 40 | pesquisa pós-export |

### 8.2 KPIs técnicos por endpoint RapidAPI
| Métrica | Descrição |
|---|---|
| Success rate | 2xx com payload útil / total |
| Completude média | % de campos obrigatórios retornados |
| Latência p50/p95 | ms por request |
| Custo por lead | $ / leads válidos gerados por endpoint |
| Erros 429/5xx | frequência |
| Circuit breaks | vezes que foi pausado |

### 8.3 Dashboard de custos
- Custo $ por usuário, por job, por endpoint, por dia.
- Projeção de consumo mensal vs. plano.
- Alertas: 80% e 95% do limite de créditos.
- Margem: (créditos cobrados do usuário) − (custo real RapidAPI) = margem por job.

---

## 9. Riscos, Limitações Legais, Considerações Éticas e Anti-Ban

### 9.1 Riscos técnicos
| Risco | Mitigação |
|---|---|
| Endpoint RapidAPI depreciado/instável | Multi-endpoint + catálogo versionado + monitor diário |
| Banimento de chave RapidAPI | Rotação de chaves; contas backup; alerta |
| Rate limit excedido | Fila + backoff + circuit breaker |
| Qualidade variável entre endpoints | Scoring histórico + fallback + merge |
| Custo estourar margem | Estimativa pré-job + limite duro por usuário |

### 9.2 Legais e éticos (LGPD / ToS Instagram)
- **LGPD**: dados pessoais (e-mail, telefone) são dados pessoais — finalidade legítima de "interesse legítimo do controlador" para prospecção comercial B2B, mas **deve haver banner de conformidade, opt-out, e política de privacidade clara**. Usuário final é responsável pelo uso (DPA/responsabilidade compartilhada).
- **ToS Instagram**: scraping pode violar ToS; o produto usa **APIs terceirizadas (RapidAPI)** e não acessa diretamente infra do Instagram. Ainda assim:
  - Não armazenar credenciais de usuários do Instagram.
  - Não automatizar login.
  - Apenas dados públicos.
  - Aviso claro ao usuário de que é responsável pelo uso conforme leis locais e ToS da plataforma.
- **Ética**: não expor dados sensíveis (saúde, crianças). Filtro de categoria proibida no MVP.
- **Anti-ban**:
  - Rate limit conservador.
  - Rotação de endpoints (diferentes provedores RapidAPI).
  - Proxy residencial opcional (Fase 1 Should Have).
  - Sem login simulado.
  - Cache para evitar requisições repetidas.

### 9.3 Riscos de negócio
- Dependência de terceiros (RapidAPI) → contrato comercial e SLA com RapidAPI; plano B com provedores diretos.
- Mudança de pricing de endpoints → repasse dinâmico e re-cálculo de margem.

---

## 10. Roadmap

### MVP — Fase 1 (Semanas 0–10)
| Sprint | Entrega |
|---|---|
| S1–S2 | Setup (Next.js, Supabase, Auth, billing base), catálogo de endpoints, client RapidAPI unificado |
| S3–S4 | Input multi-formato (CSV, usernames, URLs), jobs + fila BullMQ, workers |
| S5–S6 | Orquestrador + fallback + merge; extração de todos os campos obrigatórios |
| S7 | Enriquecimento (validação e-mail, wa.me, lead score) |
| S8 | Outputs (xlsx, csv, json, google sheets, notion, webhook) |
| S9 | Dashboard de performance por endpoint + custos + logs |
| S10 | Hardening, LGPD/ToS, beta fechado, métricas |

**Critérios de saída MVP**: KPIs 40%/28%/<6s atingidos em lote de 1.000 perfis reais; ≥ 10 usuários beta ativos; margem positiva.

### Fase 2 (Semanas 11–20)
- Busca por nicho + filtros avançados.
- Comparação automática multi-API com ranking.
- Integrações Make/n8n/Zapier + CRMs (Hubspot, Pipedrive, RD Station, ActiveCampaign).
- Dashboard de custo/ROI por usuário.
- API pública do InstaContact (beta).

### Fase 3 (Semanas 21+)
- Enriquecimento LinkedIn/CNPJ.
- Persona detection via LLM.
- SMTP real-time validation.
- WhatsApp presence check (com consentimento).
- Marketplace de templates de outreach + colaboração em equipes.

---

## 11. Critérios de Aceite Globais (MVP)
1. Usuário não-técnico consegue extrair 500 perfis e exportar em Excel sem suporte.
2. Sistema completa um lote de 1.000 perfis com ≥40% de e-mails e ≥28% de WhatsApps em ambiente real.
3. Latência média por perfil < 6s com 5 workers concorrentes.
4. Fallback comprovado: simular endpoint down e verificar continuidade do job.
5. Dashboard mostra custo $ por job e por endpoint em tempo real.
6. Banner LGPD + ToS visíveis; usuário aceita termos antes de rodar.
7. Logs auditáveis por request por 30 dias.
8. Margem de billing positiva por job (receita ≥ custo RapidAPI).

---

### Aprovações
| Papel | Nome | Data |
|---|---|---|
| Product Manager | | |
| Tech Lead | | |
| Design Lead | | |
| Legal/Compliance | | |
