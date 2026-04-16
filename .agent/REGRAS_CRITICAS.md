# 🚨 REGRAS CRÍTICAS DO PROJETO - LIGARE

**ATENÇÃO ASSISTENTE:** Estas regras são **OBRIGATÓRIAS** e devem ser seguidas **SEMPRE**.

---

## 1️⃣ EXECUÇÃO DIRETA DE SQL NO SUPABASE

### **REGRA:**
Você **TEM ACESSO DIRETO** ao banco de dados Supabase e **DEVE EXECUTAR** queries SQL diretamente.

### **NUNCA:**
- ❌ Peça ao usuário para executar SQL
- ❌ Mostre scripts SQL sem executar
- ❌ Espere o usuário copiar e colar
- ❌ Diga "execute isso no SQL Editor do Supabase"

### **SEMPRE:**
- ✅ Execute SQL diretamente usando `psql` no terminal
- ✅ Use as credenciais do arquivo `.agent/EXECUTAR_SQL_SUPABASE.md`
- ✅ Verifique o resultado das queries
- ✅ Reporte o resultado ao usuário

### **Como executar:**
```bash
PGPASSWORD='LigareDB_2026!Sec' psql -h db.jqofecfrqppsemupwjbm.supabase.co -p 5432 -U postgres -d postgres -c "SELECT 1;"
```

### **Referência:**
📄 Credenciais completas em: `.agent/EXECUTAR_SQL_SUPABASE.md`

---

## 2️⃣ PROIBIDO HARDCODE - TUDO VEM DO BANCO/ADMIN

### **REGRA:**
**NADA** pode ser hardcoded na plataforma. Configurações devem vir do banco de dados, gerenciáveis pelo painel admin ou master admin.

### **NUNCA:**
- ❌ Hardcode de preços de planos
- ❌ Hardcode de limites (crianças, check-ins, líderes)
- ❌ Hardcode de textos de WhatsApp
- ❌ Hardcode de configurações de trial

### **SEMPRE:**
- ✅ Buscar de tabelas de configuração do banco
- ✅ Usar variáveis dinâmicas que o admin pode alterar
- ✅ Se hardcode for indispensável, **notifique o usuário**

---

## 3️⃣ MULTI-TENANT: TUDO ISOLADO POR `church_id`

### **REGRA:**
A Ligare é um SaaS multi-tenant. Cada igreja é um tenant isolado.

### **SEMPRE:**
- ✅ Toda query deve filtrar por `church_id`
- ✅ RLS deve estar ativo em todas as tabelas públicas
- ✅ Verificar que dados de uma igreja nunca vazam para outra
- ✅ Respeitar o `is_platform_admin` para bypass RLS (Master Admin)

---

## 4️⃣ CENTRALIZAÇÃO - PROIBIDO DADOS DUPLICADOS

### **REGRA:**
Cada dado tem **UM E SOMENTE UM** local de origem.

### **CHECKLIST antes de adicionar campo/tabela:**
1. ☑ Este dado pode ser calculado? → Use função/view
2. ☑ Este dado já existe em outra tabela? → Faça JOIN
3. ☑ Este dado é histórico/auditoria? → OK armazenar
4. ☑ Nenhuma das opções acima? → Notifique o usuário

---

## 5️⃣ WHATSAPP GOVERNADO

### **REGRA:**
O líder **NÃO** tem campo de texto livre para mensagens WhatsApp. Apenas botões de ações pré-definidas.

## 6️⃣ POLÍTICAS RLS COMPLETAS E OBRIGATÓRIAS (CRUD)

### **REGRA:**
Sempre que uma **NOVA TABELA** for criada, é **estritamente proibido** criar apenas a política de `SELECT` e esquecer as regras de escrita. Você DEVE implementar as 4 políticas fundamentais (SELECT, INSERT, UPDATE, DELETE) para evitar que o banco fique bloqueado (read-only) para mutações legítimas do frontend.

### **SEMPRE:**
- ✅ Crie todas as policies CRUD imediatamente após o `CREATE TABLE`.
- ✅ Lembre-se que `INSERT` exige `WITH CHECK (...)` e `UPDATE/DELETE` exigem `USING (...)`.
- ✅ Certifique-se de que Líderes e Admins podem gravar/editar (respeitando o `church_id`).
- ✅ Se a tabela for estritamente Read-Only por uma regra específica de negócio, você deve comunicar isso ativamente.

---

## 7️⃣ ARQUITETURA DE DADOS: PROFILES vs CHURCH_MEMBERS (SYNC)

### **REGRA:**
A Ligare separa a camada de Autenticação/Usuários (`profiles`) da camada do CRM Físico da Igreja (`church_members`). 
Um "Visitante" existe apenas em `church_members`. Um "Líder/Admin" existe em ambos.

### **SEMPRE:**
- ✅ Toda consulta de Catálogo, Responsáveis, Participantes, ou Listagem Geral de Pessoas deve ser feita na tabela `church_members` (pois abrange tanto visitantes sem acesso quanto líderes com acesso).
- ✅ Ao criar consultas baseadas na tabela `church_members`, preste estreita atenção ao nome correto das colunas no schema real (`full_name` e `whatsapp`), **nunca assuma nomes genéricos** (como `name` ou `phone`).
- ✅ Lembre-se que existe uma `Trigger Automática` sincronizando inserções de novos `profiles` para dentro de `church_members`.

---

## 8️⃣ REACT & NEXT.JS: PROIBIDO FORMs ANINHADOS

### **REGRA:**
O React e o DOM HTML **proíbem** estruturalmente a existência de um elemento `<form>` dentro de outro `<form>`. Isso causa conflito de chamadas e a propagação silenciosa de eventos quebra as Server Actions no Next.js (Erro: form unexpectedly submitted).

### **SEMPRE:**
- ✅ Se você precisa de um sub-formulário (como um "Criar Rápido") dentro de um Modal que já possui um `<form>` principal para salvar todo o estado: substitua o sub-formulário por `<div>` e use um `<button type="button" onClick={...}>` capturando os valores manualmente instanciando o `new FormData()` ou via `useState`.

---

## 📋 CHECKLIST DE VALIDAÇÃO

Antes de **qualquer** modificação técnica ou criação de código:

- [ ] Estou executando SQL diretamente para testar/verificar dados (não pedindo ao usuário)?
- [ ] Configurei e verifiquei ativamente o RLS, certificando-se de que a role específica do usuário (ex: `kids_team`, `leader`) tem permissão pra interagir com essa tabela?
- [ ] Consultei os nomes REAIS das colunas no banco de dados (ao invés de presumir)?
- [ ] Garanti que nenhum `<form>` de React está inserido dentro de outro `<form>` pai?
- [ ] O WhatsApp está sendo invocado por link/botão bloqueado vs texto livre?

---

**Data da Última Atualização:** 02/04/2026 (Atualizado Pós-Auditoria de Módulo Kids)
**Versão:** 1.2

