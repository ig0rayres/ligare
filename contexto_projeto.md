# CONTEXTO_PROJETO

---

## 🚨 REGRAS CRÍTICAS OBRIGATÓRIAS

**ATENÇÃO ASSISTENTE:** Antes de qualquer ação, leia e siga:

📜 **[REGRAS_CRITICAS.md](.agent/REGRAS_CRITICAS.md)**

**Resumo:**
1. ✅ Execute SQL direto no Supabase (não peça ao usuário)
2. ❌ Proibido hardcode - tudo vem do painel admin
3. ⚠️ Multi-tenant: tudo isolado por `church_id`
4. 🎯 Centralização de dados - proibido duplicar informações
5. 📱 WhatsApp governado - apenas botões, sem texto livre

---

## 🔌 Acesso Direto ao Banco

- **Credenciais em:** `.agent/EXECUTAR_SQL_SUPABASE.md`
- **Host:** `db.jqofecfrqppsemupwjbm.supabase.co`
- **Porta:** `5432`
- ⚠️ **ASSISTENTE: Execute SQL direto. NÃO peça ao usuário.**

```bash
PGPASSWORD='LigareDB_2026!Sec' psql -h db.jqofecfrqppsemupwjbm.supabase.co -p 5432 -U postgres -d postgres -c "SEU SQL AQUI"
```

---

## 1. Visão geral do projeto

**Ligare** é uma plataforma digital para igrejas, com foco em **cuidado, acompanhamento, organização ministerial, segurança no módulo infantil, comunicação estruturada via WhatsApp e follow-up de membros e visitantes**.

A proposta central do produto não é apenas oferecer um app institucional para igrejas, mas sim criar um **sistema operacional de relacionamento e cuidado**, capaz de conectar:

* igreja
* liderança
* membros
* visitantes
* responsáveis por crianças
* células
* equipes ministeriais

O produto deve unir **tecnologia, acolhimento, governança e simplicidade operacional**, com forte apelo comercial no módulo **Kids Check-in** e no **motor de follow-up pastoral**.

---

## 2. Objetivo estratégico do produto

Criar um SaaS para igrejas com as seguintes características:

* escalável
* recorrente
* alta margem
* fácil adesão
* operação simples
* forte percepção de valor
* capacidade de entrada via plano free
* expansão para planos pagos por volume, recursos e operação

O produto deve ser atrativo o suficiente na versão gratuita para gerar adoção, mas com limitações e upgrades que incentivem a migração para planos pagos.

---

## 3. Posicionamento

A Ligare deve ser posicionada como uma:

**plataforma de cuidado conectado para igrejas**

com foco em:

* segurança no Kids
* organização de líderes e células
* follow-up de visitantes e membros
* comunicação centralizada via WhatsApp
* acompanhamento pastoral estruturado

A plataforma deve parecer:

* confiável
* moderna
* acolhedora
* organizada
* institucional
* fácil de usar

---

## 4. Tese do MVP

O MVP da Ligare deve entrar no mercado com a seguinte tese:

**“Uma plataforma que ajuda a igreja a cuidar melhor das pessoas, começando pelo Kids, pelo follow-up e pela comunicação centralizada.”**

Os 3 pilares principais do MVP são:

1. **Kids Check-in**
2. **Follow-up de visitantes e membros**
3. **WhatsApp da igreja como canal oficial e governado**

---

## 5. Estrutura macro do produto

O produto possui 3 grandes camadas:

### 5.1. Hub público da igreja

Espaço acessível sem login, usado como porta de entrada para visitantes, membros e famílias.

### 5.2. Aplicativo / experiência do usuário

Área autenticada para membros, líderes, responsáveis e equipe.

### 5.3. Painel administrativo e operacional

Área de gestão da igreja, líderes, acompanhamento, kids, comunicação e configurações.

### 5.4. Painel Master Admin (Gestão do SaaS)

Área exclusiva para os donos da Ligare gerenciarem assinaturas, bloqueios, faturamento da plataforma e oferecer suporte (impersonation).

---

## 6. Módulos do produto

## 6.1. Hub público da igreja

Funções principais:

* Cadastre-se
* Dízimos e ofertas
* Encontre uma célula
* Download do app
* Fale com a igreja
* Pedido de oração
* Acesso a eventos principais

Objetivos:

* captar visitantes
* captar famílias
* iniciar fluxos de follow-up
* facilitar adesão
* servir como link principal da igreja

---

## 6.2. Aplicativo da plataforma

O app deve ser um **app único da plataforma**, com customização por igreja.

### Customização por igreja

* nome
* logo
* cores
* textos principais
* nomenclatura das roles

### Áreas principais do app

* perfil
* agenda e eventos
* minha célula
* encontrar célula
* mural / avisos
* minhas contribuições
* pedidos de oração
* fale com a igreja

---

## 6.3. Gestão de roles e hierarquia

O sistema precisa permitir roles técnicas configuráveis, com nomes adaptáveis à realidade da igreja.

### Base técnica

* super admin
* admin
* manager
* líder
* membro
* equipe kids

### Exemplos de customização

* pastor
* discipulador
* obreiro
* líder de célula
* líder kids

Objetivo:

permitir flexibilidade sem perder a estrutura de permissões do sistema.

---

## 6.4. Módulo Minha Célula

Funções:

* visualizar célula vinculada
* dados do líder
* próximos encontros
* avisos
* contatos e informações importantes
* eventual histórico de presença no futuro

---

## 6.5. Camada social / comunidade interna

Esse módulo existe como visão futura, mas **não é prioridade do MVP**.

Pode começar apenas com:

* mural de avisos
* publicações institucionais
* comunicações principais

Não implementar rede social complexa no MVP.

---

## 6.6. Cadastro e gestão de eventos

Funções:

* cadastro de eventos
* agenda pública
* agenda interna
* datas, horários, local e descrição
* CTA para participação
* integração com follow-up

---

## 6.7. Push notifications

Funções:

* avisos institucionais
* lembretes de eventos
* notificações de célula
* comunicação complementar ao WhatsApp

---

## 6.8. Kids Check-in

Esse é um dos módulos mais importantes do produto e principal wedge comercial do MVP.

### Funções essenciais

* cadastro de criança
* vínculo com responsável
* check-in
* check-out
* turma / sala
* observações importantes
* histórico básico por culto/dia
* controle operacional da equipe kids
* botão **Chamar responsável**

### Regras do botão Chamar responsável

* sem campo dissertativo
* sem mensagem livre
* ação via botão
* envio pelo WhatsApp oficial da igreja
* com registro de horário e status do envio

### Valor percebido do módulo

* segurança
* organização
* agilidade
* ponto sensível e relevante para igrejas
* forte argumento de venda

---

## 6.9. Encontre uma célula

Funções:

* busca de células
* localização / bairro / região
* dia e horário
* líder responsável
* CTA para contato

Objetivo:

facilitar integração e expansão do relacionamento.

---

## 6.10. Ofertar / dizimar

O produto deve permitir:

* acesso ao fluxo de oferta / dízimo
* possibilidade de direcionar para PIX / link da igreja
* integração simples no MVP

---

## 6.11. Histórico de contribuições

Cada membro deve ter uma sessão própria, por exemplo:

**Minhas contribuições**

### Funções

* registrar contribuição manualmente
* anexar comprovante
* informar tipo
* informar valor
* informar data
* observação curta opcional
* histórico mensal
* total por período
* status do lançamento

### Tipos de contribuição

* dízimo
* oferta
* campanha
* projeto

### Status básicos

* registrado
* confirmado

### Objetivo

* aumentar valor percebido
* criar histórico pessoal
* apoiar transparência e constância

Observação:

No MVP, isso deve ser tratado como **registro e acompanhamento de contribuições**, não como contabilidade oficial completa.

---

## 6.12. Transparência / prestação de contas

Esse módulo pode existir como visão futura.

No MVP, não precisa ser um financeiro robusto.

---

## 6.13. Projetos sociais / projetos da igreja

Pode entrar como área institucional leve:

* listagem
* descrição
* chamada para participação
* conteúdo da igreja

---

## 7. Gestão de membros e vínculo com liderança

Cada membro precisa poder ser associado a um líder.

### Regra principal

No cadastro do novo membro, deve existir um campo:

**Quem é seu líder?**

### Comportamento esperado

* listar líderes ativos da igreja
* permitir associação automática
* adicionar esse membro à base do líder
* alimentar o fluxo de presença e follow-up

### Opção necessária

* “Não sei quem é meu líder”

Nesse caso:

* entra em fila de atribuição
* admin/pastoral define depois

---

## 8. Painel do líder

O líder precisa gerenciar sua base e atuar como unidade funcional de cuidado.

### Funções do painel do líder

* ver sua equipe/base
* ver visitantes atribuídos
* ver novos membros
* ver presença do grupo
* ver faltantes
* ver pedidos de oração
* ver pendências de follow-up
* acionar mensagens por botões
* registrar acompanhamento
* validar presença pós-culto

### O líder não deve poder

* iniciar conversa livre no WhatsApp
* usar número pessoal no fluxo oficial
* disparar mensagens abertas fora das regras do sistema

---

## 9. Motor de presença

A presença não deve depender de um único check-in.

Deve existir um modelo híbrido de identificação.

### Fontes de presença

* cadastro do visitante no culto
* kids check-in
* check-in explícito do membro
* interação com QR/hub no culto
* validação do líder

### Classificações possíveis

* visitante
* presente confirmado
* presente provável
* ausente
* não confirmado

### Estratégia

* presença forte: kids ou check-in explícito
* presença assistida: validação do líder
* presença provável: QR/hub ou sinais fracos

---

## 10. Fluxo pós-culto e follow-up

Esse é um dos núcleos mais importantes do produto.

A plataforma deve contemplar follow-up para:

* visitantes
* novos membros
* membros presentes
* membros faltantes
* membros inativados / afastados

---

## 10.1. Visitantes

### Entrada

* cadastro no hub
* formulário no culto
* QR
* recepção

### Ações

* boas-vindas
* convite para célula
* oferecer oração
* falar com líder/igreja

### Status possíveis

* novo
* contatado
* aguardando retorno
* quer célula
* quer falar com líder
* encerrado

---

## 10.2. Novos membros

### Entrada

* cadastro direto
* conversão de visitante
* importação/admin

### Ações

* atribuir líder
* boas-vindas
* apresentar líder
* convidar para célula
* iniciar acompanhamento

### Status

* novo membro
* líder atribuído
* contato feito
* integrado
* em acompanhamento

---

## 10.3. Membros presentes

### Ações possíveis

* agradecimento pós-culto
* reforço de vínculo
* convite para célula/evento
* pedido de feedback leve
* oferta de oração

---

## 10.4. Membros faltantes

### Regras

Se o membro não tiver sinais de presença, entra em fluxo de ausência.

### Ações

* sentimos sua falta
* está tudo bem?
* quer oração?
* escalar para líder
* acompanhamento pastoral se necessário

### Status

* faltante recente
* faltante recorrente
* contato feito
* justificou ausência
* sem resposta
* em cuidado

---

## 10.5. Inativação / exclusão lógica

O sistema não deve excluir membros definitivamente como primeira opção.

### Status sugeridos

* ativo
* inativo
* afastado
* transferido
* removido

### Motivos

* transferência
* afastamento voluntário
* ausência prolongada
* duplicidade
* remoção administrativa

---

## 11. Comunicação via WhatsApp

Esse é um diferencial estratégico da plataforma.

### Regra central

Toda comunicação deve acontecer, por padrão, através do **WhatsApp oficial da igreja**.

### Objetivo

* evitar exposição de números pessoais
* manter governança
* preservar histórico
* proteger igreja, líderes e membros
* estruturar atendimento

### Modelo operacional

* canal único da igreja
* inbox centralizado
* roteamento interno
* atribuição por setor/líder
* resposta pelo app, não pelo WhatsApp pessoal

---

## 11.1. Comunicação controlada do líder

O líder **não deve iniciar conversa livre**.

### Antes da resposta do membro

O líder só pode interagir por:

* botões
* mensagens pré-definidas
* ações estruturadas

### Exemplos de botões

* enviar saudação
* fazer follow-up
* convidar para célula
* sentimos sua falta
* responder pedido de oração
* convidar para evento
* solicitar retorno

### Depois que o membro responde

* o canal é aberto
* o líder pode continuar via app
* o número pessoal continua oculto
* a conversa segue pelo WhatsApp da igreja

### Estados da conversa

* fechada
* aguardando resposta
* aberta
* em acompanhamento
* encerrada

---

## 11.2. Integração com WhatsApp

### Curto prazo / piloto

Possível integração com WAHA para pilotos e testes controlados.

### Longo prazo / linha principal

WhatsApp oficial via Meta / onboarding estruturado.

### O que o sistema deve suportar

* chamar responsável do kids
* boas-vindas pós-cadastro
* follow-up pós-culto
* pedido de oração
* convite para célula
* falar com líder/igreja

---

## 12. IA dentro da plataforma

A IA deve entrar como **classificador e roteador**, não como substituto pastoral completo.

### IA pode

* classificar classificar respostas
* interpretar intenção
* organizar filas
* consolidar presença
* interpretar respostas curtas do líder
* sugerir próximo passo
* encaminhar para o setor responsável

### IA não deve

* aconselhar profundamente sem supervisão
* tratar temas sensíveis sozinha
* excluir/inativar membros automaticamente

---

## 13. Estratégia comercial

## 13.1. Versão free

A versão gratuita precisa ser útil o suficiente para gerar adoção.

### Pode incluir

* hub público
* cadastro de visitante
* encontre uma célula
* fale com a igreja
* kids básico
* botão chamar responsável
* agenda simples
* mural/avisos
* minhas contribuições
* branding da plataforma

### Com limites

* limite de crianças
* limite de check-ins
* limite de líderes/admins
* limite de células
* limite de eventos
* sem relatórios avançados
* sem automações complexas

---

## 13.2. Planos pagos

A monetização deve seguir a lógica:

**mensalidade base + faixas de membresia + add-ons premium**

### Planos sugeridos

* Free
* Start
* Growth
* Pro
* Enterprise

### Add-ons possíveis

* WhatsApp avançado
* IA avançada
* número institucional / ativação
* multiunidade
* onboarding premium
* branding avançado

---

## 13.3. Ciclo de Vida do Cliente e Onboarding

O processo de entrada de novas igrejas deve ser fluido, mas protegido:

### Self-Service Onboarding

* A igreja cria a conta automaticamente pela Landing Page.
* Inicia imediatamente no **período de Trial** (ex: 7 ou 14 dias), gerenciável pelo Master Admin.
* Durante o MVP promocional, o uso pode ser vitalício gratuito.

### Bloqueio por falta de pagamento

* Após a transição para modelo pago, ou fim do trial, o login de administradores e líderes será bloqueado até a regularização da assinatura.
* Membros comuns podem continuar tendo acesso restrito ao Hub Público, dependendo da estratégia comercial.

---

## 13.4. Master Admin (Gestão da Plataforma)

Para sustentar a operação como SaaS, a plataforma conta com uma área `/master-admin` (na mesma base de código, protegida por flag de permissão `is_platform_admin`). 

### Atribuições do Master Admin:

1. **Gestão de Tenants (Igrejas):** Visualizar todas as igrejas ativas, em trial, ou bloqueadas.
2. **Financeiro do SaaS:** Dashboard de MRR, assinaturas ativas, e faturamento da Ligare (não envolve o financeiro interno de dízimos da igreja).
3. **Gestão de Trial:** Conceder ou estender os dias de teste de igrejas específicas.
4. **Impersonation (Acesso de Suporte):** Capacidade de o dono da Ligare se logar "como se fosse" o admin de uma igreja específica para investigar bugs ou dar suporte operacional.

---

## 14. Diferenciais competitivos da Ligare

Os principais diferenciais construídos até aqui são:

* Kids Check-in com forte apelo de segurança
* Botão de chamar responsável
* Follow-up pastoral estruturado
* Presença híbrida via kids + visitante + líder
* Liderança associada ao membro
* Comunicação centralizada pelo WhatsApp da igreja
* Líder restrito a interações estruturadas antes da resposta do membro
* IA como triagem e roteamento
* Plataforma pensada como cuidado operacional, não só app institucional

---

## 15. O que fica fora do MVP

Para manter foco, os seguintes itens não devem ser prioridade inicial:

* white label completo por igreja na loja
* app próprio separado por igreja na app store
* rede social complexa entre membros
* ERP financeiro completo
* transparência financeira robusta
* chatbot pastoral avançado
* organograma complexo multi-hierarquia
* automações excessivamente sofisticadas

---

## 16. Identidade da marca

### Nome

**Ligare**

### Significado

Ligação, vínculo, continuidade, conexão entre pessoas, igreja, liderança e cuidado.

### Logo

A identidade visual aprovada parte da leitura de **tumba vazia abstrata**, com:

* brasão / ícone
* logo vertical
* logo horizontal (derivável)

### Paleta oficial

* Midnight Navy `#0F172A`
* Bridge Blue `#1F6FEB`
* Care Green `#18B37E`
* Cloud `#F8FAFC`
* Soft Mist `#E8F0FF`
* Slate `#475569`

### Regra prática

* 60% base neutra
* 25% azul institucional
* 10% marinho para contraste
* 5% verde para destaque

### Tipografia

* Manrope
* Inter
* fallback: Aptos / Arial

---

## 17. Resumo executivo do produto

A Ligare é uma plataforma SaaS para igrejas com foco em:

* cuidado conectado
* segurança no kids
* comunicação estruturada
* acompanhamento pastoral
* gestão de líderes e membros
* follow-up de visitantes e faltantes
* operação simples e escalável

A proposta não é ser apenas um app institucional, mas uma **plataforma operacional de relacionamento e cuidado**, que ajude a igreja a acompanhar pessoas com mais segurança, contexto e consistência.

---

## 18. Estado Atual da Implementação (Atualizado: 31/03/2026)

### 18.1. Infraestrutura & Autenticação
- ✅ **Supabase:** Projeto configurado (`jqofecfrqppsemupwjbm`)
- ✅ **Multi-tenancy:** RLS com `get_my_church_id()` (`SECURITY DEFINER`) em todas as tabelas
- ✅ **Auth:** Sign Up + Sign In com `supabase.auth` (confirmação de e-mail desabilitada para Trial)
- ✅ **Onboarding:** RPC `create_new_tenant` → cria usuário, igreja, assinatura trial 14 dias, perfil super_admin
- ✅ **Middleware Next.js:** Proteção de rotas (redirect `/dashboard` ↔ `/login`)
- ✅ **Storage:** Bucket `kids` com políticas RLS (leitura pública, escrita autenticada)

### 18.2. Master Admin (`/dashboard/master-admin`)
- ✅ Verificação `is_platform_admin`
- ✅ Métricas SaaS (total igrejas, trials, pagos)
- ✅ Tabela de tenants com plano/status/expiração
- ⬜ Impersonation (planejado)
- ⬜ Dashboard financeiro MRR (planejado)

### 18.3. Gestão de Membros (`/dashboard/membros`)
- ✅ CRUD completo de membros
- ✅ Associação de roles por membro
- ✅ Vínculo líder ↔ membro
- ✅ Sidebar dinâmica (nome da igreja, plano)

### 18.4. Módulo Kids (`/dashboard/kids`)
- ✅ **Painel:** Visão geral do ministério infantil
- ✅ **Crianças:** CRUD completo com:
  - Upload de foto via Supabase Storage
  - Gestão de responsáveis (até 4, com "Principal")
  - Aprovação de cadastros (pending → approved/rejected)
  - Busca e filtros por status
  - Modal responsivo (2 colunas desktop, coluna única mobile)
- ✅ **Salas:** CRUD com upload de foto, nome único por igreja (`UNIQUE(church_id, name)`)
- ✅ **Escalas:** Agendamento por data/sala com equipe (Líder + Auxiliares)
- ✅ **Relatórios:** Métricas de frequência, volume de crianças, distribuição por sala
- ⬜ **Check-in/Check-out:** QR Code dinâmico/fixo (planejado)
- ⬜ **Notificações:** Envio de QR Code via WhatsApp/plataforma (planejado)
- ⬜ **Botão Chamar Responsável** (planejado)

### 18.5. Módulos Pendentes (Roadmap)
- ⬜ Follow-up Engine (pós-presença)
- ⬜ Hub Público da Igreja
- ⬜ Células (Encontre/Minha Célula)
- ⬜ Eventos e Agenda
- ⬜ Comunicação WhatsApp centralizada
- ⬜ Contribuições (Dízimos/Ofertas)
- ⬜ Painel do Líder
- ⬜ Motor de Presença híbrido
- ⬜ Push Notifications
- ⬜ Integração IA (classificador/roteador)

### 18.6. Stack Técnica
| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 (App Router) |
| UI | CSS Variables + Glassmorphism + Lucide Icons |
| Auth | Supabase Auth (email/senha) |
| Database | PostgreSQL (Supabase) com RLS |
| Storage | Supabase Storage (bucket `kids`) |
| Deploy | Em definição |

### 18.7. Schema do Banco (Tabelas Principais)
| Tabela | Descrição |
|--------|-----------|
| `churches` | Igrejas (tenants) |
| `profiles` | Perfis de usuários |
| `subscriptions` | Assinaturas e planos |
| `church_members` | Membros da igreja |
| `church_roles` | Roles customizáveis |
| `member_roles` | Associação membro ↔ role |
| `kids_children` | Crianças cadastradas |
| `kids_guardians` | Responsáveis vinculados |
| `kids_classrooms` | Salas do Kids |
| `kids_checkins` | Check-ins (preparado) |
| `kids_schedules` | Escalas do Kids |
| `kids_schedule_staff` | Equipe por escala |
