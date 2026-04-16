# Workload & Changelog: Ligare Plataforma

Este documento registra todas as sessões de trabalho, horas investidas e as entregas técnicas/negócio realizadas no projeto Ligare.

---

## Sessão: 31 de Março de 2026
**Duração Estimada:** 1.5 Horas  
**Foco:** Integração Backend Supabase + Autenticação + Master Admin

### O que foi entregue hoje:
- [x] **Credenciais Supabase:** `.env.local` criado com Project URL e Anon Key extraídas do JWT.
- [x] **Migration SQL Executada:** Schema completo (14 tabelas + RLS + RPC `create_new_tenant`) rodado com sucesso no Supabase SQL Editor.
- [x] **Confirmação de E-mail:** Desabilitada no Supabase para permitir fluxo de Trial sem fricção.
- [x] **Fluxo de Registro (Real):** `supabase.auth.signUp()` + chamada RPC `create_new_tenant` implementados no `/(auth)/register/page.tsx`. Onboarding completo: cria usuário → igreja → assinatura trial 14 dias → perfil super_admin.
- [x] **Fluxo de Login (Real):** `supabase.auth.signInWithPassword()` implementado no `/(auth)/login/page.tsx` com tratamento de erros em PT-BR.
- [x] **Teste E2E Validado:** Registro completo testado no navegador → usuário autenticado → redirecionamento automático para Dashboard confirmado.
- [x] **Logout Funcional:** Botão "Sair" no dashboard agora executa `supabase.auth.signOut()` e redireciona para `/login`.
- [x] **Master Admin Baseline:** Página `/dashboard/master-admin/page.tsx` criada como Server Component com: verificação de `is_platform_admin`, métricas SaaS (total igrejas, trials, pagos) e tabela de tenants com plano/status/expiração.
- [x] **Sidebar atualizada:** Link do Master Admin (ícone Shield) adicionado ao layout do dashboard.

---

## Sessão: 30 de Março de 2026
**Duração Estimada:** 3 Horas  
**Foco:** Refinamento de Branding e Planejamento Arquitetural (Supabase / Master Admin)

### O que foi entregue hoje:
- [x] **Identidade Visual:** Scripts Python executados para corte limpo e geração das variações oficias do Brasão Ligare.
- [x] **Integração Front-end Branding:** Logotipo oficial injetado com aumento de tamanho de 25% na Landing Page (Header e Footer), Sidebar do Dashboard e páginas de Login/Cadastro.
- [x] **Arquitetura Multi-Tenant:** Atualização do `contexto_projeto.md` especificando claramente a diferença da operação SaaS (Trial Flow) e adicionando a camada do **Painel Master Admin**.
- [x] **Supabase Setup (SQL):** Modificações críticas na migration `001_initial_schema.sql`, inserindo a flag de `is_platform_admin`, configurando `RLS Bypasses` e criando o RPC `create_new_tenant` auto-invocável no onboarding.
- [x] **Middleware (Next.js):** Lógica estrutural de proteção de rotas (Redirect de `/dashboard` para não-logados e `/login` para já-logados) no `middleware.ts`.

---

## Sessão: 31 de Março de 2026 (Tarde/Noite)
**Duração Estimada:** 4 Horas  
**Foco:** Módulo Kids Completo + Gestão de Membros + Refinamento UI

### O que foi entregue:

#### Gestão de Membros
- [x] **CRUD Membros:** Listagem, cadastro e gestão de membros da igreja
- [x] **Roles & Hierarquia:** Associação de roles customizáveis por membro
- [x] **Vínculo Líder ↔ Membro:** Campo "Quem é seu líder?" funcional
- [x] **Sidebar Dinâmica:** Nome da igreja e plano carregados do banco
- [x] **Master Admin Promovido:** `is_platform_admin = true` via SQL

#### Módulo Kids — CRUDs Completos
- [x] **Schema DB:** Tabelas `kids_children`, `kids_guardians`, `kids_classrooms`, `kids_checkins`, `kids_schedules`, `kids_schedule_staff` + RLS + indexes
- [x] **Storage:** Bucket `kids` no Supabase Storage com políticas de acesso
- [x] **Multi-tenancy:** Função `get_my_church_id()` como `SECURITY DEFINER` (resolve recursão RLS)
- [x] **Painel Kids:** Dashboard overview do ministério infantil
- [x] **CRUD Crianças (`/dashboard/kids/criancas`):**
  - Server Actions (create, update, delete, approve/reject)
  - Upload de foto via Supabase Storage
  - Gestão de até 4 responsáveis com "Responsável Principal"
  - Modal elegante 2 colunas (desktop) / coluna única (mobile)
  - Filtros por status (Todas/Aprovadas/Pendentes) + busca
  - `useTransition` em todos os formulários (debounce submissões)
- [x] **CRUD Salas (`/dashboard/kids/salas`):**
  - Upload de foto (File Input → Storage)
  - Restrição `UNIQUE(church_id, name)` — sem duplicatas
  - Cards responsivos com status ativo/inativo e contagem
- [x] **CRUD Escalas (`/dashboard/kids/escalas`):**
  - Agendamento por data e sala
  - Equipe: Líder Kids + Auxiliares (via members)
  - Agrupamento visual por data
- [x] **Relatórios (`/dashboard/kids/relatorios`):**
  - Filtro por período (7d/30d/90d)
  - Métricas: check-ins, crianças, alertas
  - Distribuição por sala (cards visuais)

#### Refinamento UI/UX
- [x] **Modal Nova Criança:** Redesenhado com layout 2 colunas, foto à esquerda, dados à direita
- [x] **Responsividade Mobile:** Modal estilo bottom-sheet, grid 1-col, foto compacta, header sticky
- [x] **Layout Kids:** Removido `overflow-y-auto` que cortava modais fixos
- [x] **Design System:** Consistência com Glassmorphism + Forest & Gold branding

### Decisões Técnicas:
- **RLS sem recursão:** `get_my_church_id()` como `SECURITY DEFINER` elimina loops em policies
- **Upload direto:** Foto vai pro Storage via FormData nas Server Actions (não URL externa)
- **Multi-tenant routing:** URLs padrão (`/dashboard/kids/...`) com isolamento via RLS, não subdomínio

---

## Sessão: 14 de Abril de 2026
**Duração Estimada:** 2.5 Horas
**Foco:** Integração WhatsApp Self-Service (Hello Paco B2B + Asaas Billing)

### O que foi entregue hoje:

#### Infraestrutura de Integração
- [x] **Hello Paco B2B Client:** Arquivo `src/lib/hellopaco/client.ts` com os 3 métodos oficiais da API: `purchaseAddon`, `createInstance`, `getQrCode`. Key de parceiro configurada no `.env.local`.
- [x] **Proxy Endpoint QR Code:** Rota `GET /api/whatsapp/qrcode` criada no Next.js — serve como proxy seguro para buscar o QR Code da Hello Paco no backend, sem expor tokens ao browser.
- [x] **Migration Supabase:** `015_asaas_billing_and_whatsapp_configs.sql` executada — coluna `asaas_customer_id` adicionada à tabela `churches`.

#### Billing Asaas (Self-Service)
- [x] **Server Actions:** `settings/whatsapp/actions.ts` com criação de Customer Asaas, geração de cobrança PIX, link de pagamento Cartão de Crédito, e função `activateWhatsAppForChurch` (compra a quota na Hello Paco + cria instância WAHA).
- [x] **Webhook Receiver:** `POST /api/asaas/webhook` implementado — ao receber `PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED`, identifica a Igreja via `externalReference` e aciona o provisionamento automático na Hello Paco.

#### Interface (Painel da Igreja)
- [x] **Tela Paywall:** Design premium com benefícios, preço e CTA para contratação do canal.
- [x] **Tela de Checkout:** Seleção de método de pagamento (PIX com ativação imediata / Cartão de Crédito via link).
- [x] **Tela PIX:** QR Code do Asaas + campo Copia e Cola com botão de copiar.
- [x] **Tela Scanner WhatsApp:** Exibe QR Code B64 da Hello Paco com polling a cada 8 segundos. Detecta `CONNECTED` e exibe tela de sucesso automaticamente.
- [x] **Sidebar atualizada:** Link "WhatsApp" (ícone Smartphone) adicionado à navegação — visível apenas para `super_admin` e `admin`.

#### Fixes de Compilação
- [x] `consent/kids/.../page.tsx` — Corrigido para Next.js 15 (`params` como `Promise<>`).
- [x] `kids/checkin/page.tsx` — `useSearchParams()` envolvido em `<Suspense>` (build fix obrigatório).
- [x] **Build: Exit code 0 ✅** — 26 rotas compiladas com sucesso.

### Decisões Técnicas:
- **Fluxo de Ativação:** Igreja paga (PIX/CC) → Webhook Asaas confirma → Ligare compra quota na Hello Paco → cria instância WAHA → salva `hp_instance_id` em `subscriptions.features` → tela do QR Code destrava.
- **Isolamento Multi-Tenant:** Cada Igreja tem sua própria instância WAHA na Hello Paco, identificada por `church_id` como `external_device_id`.
- **Segurança:** Token Bearer da Hello Paco nunca sai do servidor Next.js — frontend sempre consome o proxy interno.

---

## 🚀 PONTO DE PARTIDA — Sessão de 15 de Abril de 2026

> ⚠️ **LEIA ISSO PRIMEIRO amanhã antes de qualquer ação.**

### Pré-requisito: Configurar as chaves reais no `.env.local`

As seguintes variáveis estão com valores placeholder e precisam ser substituídas pelas chaves reais antes de testar:

```env
ASAAS_API_URL=https://sandbox.asaas.com/api/v3        ← trocar para produção quando pronto
ASAAS_API_KEY=YOUR_ASAAS_KEY_HERE                      ← INSERIR CHAVE REAL DO ASAAS
ASAAS_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE          ← INSERIR TOKEN DO WEBHOOK ASAAS
NEXT_PUBLIC_APP_URL=https://app.ligare.com.br          ← confirmar URL de produção
```

### Tarefas de Amanhã (por prioridade):

- [ ] 1. **Configurar Asaas:** Inserir a chave real da conta Asaas (sandbox ou produção) no `.env.local`. Registrar o webhook `/api/asaas/webhook` no painel do Asaas com o token secreto.
- [ ] 2. **Teste E2E do Fluxo Completo:** Simular compra PIX no Asaas Sandbox → disparar webhook manualmente → verificar se `features.hp_instance_id` aparece na tabela `subscriptions` → confirmar exibição do QR Code na tela.
- [ ] 3. **Botão "Chamar Responsável" (Kids):** Conectar o botão existente no check-in ao serviço de WhatsApp — ao clicar, envia mensagem via instância WAHA da igreja para o responsável cadastrado.
- [ ] 4. **Dashboard Dinâmico:** Substituir dados estáticos do Dashboard principal por queries reais ao Supabase (crianças hoje, check-ins, membros ativos).
- [ ] 5. **Hub Público da Igreja:** Página pública (`/public/[slug]`) com cadastro de visitante, encontre célula, fale com a igreja.
