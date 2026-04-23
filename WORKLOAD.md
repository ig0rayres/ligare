# Workload & Changelog: Ligare Plataforma

> **🔑 INFRAESTRUTURA AVISO:** 
> O projeto Supabase do Ligare (ID: `jqofecfrqppsemupwjbm`) está vinculado à conta de e-mail **igor@dothouse.com.br**. Se houverem problemas de acesso, verifique este e-mail.

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

## Sessão: 16 de Abril de 2026
**Duração Estimada:** 3 Horas  
**Foco:** Arquitetura Multi-Tenant Isolada, Subdomínios e Onboarding Autônomo White Label

### O que foi entregue hoje:
- [x] **Infraestrutura Wildcard (Middleware):** Implementação de roteamento avançado no `middleware.ts` do Next.js. Isolamento total por subdomínio (ex: `[subdominio].ligare.app`).
- [x] **Acesso Seguro via Raiz:** Bloqueio de renderizações indevidas pela raiz do subdomínio: acesso à `/` agora redireciona forçadamente para `/login` de forma nativa e sem quebras do Edge Runtime.
- [x] **Onboarding Autônomo e Descentralizado:** Criação das telas dinâmicas `[domain]/register` e `[domain]/login`. Cada página agora consome dinamicamente a `logo_url`, `primary_color` e `secondary_color` respectiva da igreja dona do subdomínio.
- [x] **Segurança (RPC DB):** Autoria e update da Stored Procedure `public.register_tenant_member` no Supabase para rodar com `SECURITY DEFINER`, acoplando o usuário logado perfeitamente ao `church_id` extraído do banco e bypassando as restrições RLS.
- [x] **Módulo Fiscal (Preparação Asaas):** Extensão da tabela `profiles` com a coluna fiscal `cpf`. Incorporação do dado com máscara React e validação de algoritmo nativo no `/register`. Todo membro comum agora possui CPF formatado salvo direto no banco.

---

## 🚀 PONTO DE PARTIDA — Próxima Sessão (17 de Abril de 2026)

> ⚠️ **LEIA ISSO PRIMEIRO amanhã antes de qualquer ação.**

### Foco Total no Fluxo de Comunicação e Testes!
Amanhã o dia é dedicado a validar e consolidar o core de engajamento do projeto.

### Tarefas de Amanhã (por prioridade):
- [ ] 1. **Testing Completo do WhatsApp (Hello Paco):** Configuração final e end-to-end de testes do fluxo do WhatsApp acoplado à plataforma Hello Paco. Geração do QR Code e emissão de instâncias autônomas.
- [ ] 2. **Fluxos Táticos de Notificação Kids:** Encadeamento do fluxo de "Chamar Responsável" do painel de Kids Check-in -> WhatsApp disparado pela instância WAHA isolada do tenant.
- [ ] 3. **Mensageria Automática & Follow-up:** Testar envio de mensagens transacionais pós-checkin.
- [ ] 4. **Teste E2E de Billing (Asaas):** Testar contratação real simulada do canal via Sandbox Asaas via PIX.
- [ ] 5. **Validação das Páginas Públicas (Hub da Igreja):** Consumação da interface pública (Encontrar Células) usando o novo design system enxugado pelo CPF do visitante.
