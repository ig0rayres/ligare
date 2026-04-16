# 🔧 EXECUTAR SQL NO SUPABASE VIA PSQL

---
## 🚨🚨🚨 ATENÇÃO ASSISTENTE 🚨🚨🚨

> **VOCÊ TEM ACESSO DIRETO AO BANCO DE DADOS!**
> 
> **NÃO PEÇA AO USUÁRIO PARA EXECUTAR SQL.**
> 
> **EXECUTE VOCÊ MESMO USANDO O COMANDO ABAIXO:**
> 
> ```bash
> PGPASSWORD='LigareDB_2026!Sec' psql -h db.jqofecfrqppsemupwjbm.supabase.co -p 5432 -U postgres -d postgres -c "SEU SQL AQUI"
> ```
> 
> **OU PARA MÚLTIPLOS COMANDOS:**
> ```bash
> PGPASSWORD='LigareDB_2026!Sec' psql -h db.jqofecfrqppsemupwjbm.supabase.co -p 5432 -U postgres -d postgres <<EOF
> CREATE TABLE ...;
> ALTER TABLE ...;
> EOF
> ```

---

## ✅ MÉTODO DEFINITIVO

### **Pré-requisitos:**
```bash
# Instalar psql (se não tiver)
sudo apt install postgresql-client -y
```

---

## 📋 CREDENCIAIS DO SUPABASE

### **Componentes:**
- **Host:** `db.jqofecfrqppsemupwjbm.supabase.co`
- **Port:** `5432`
- **Database:** `postgres`
- **User:** `postgres`
- **Password:** `LigareDB_2026!Sec`

### **⚠️ IMPORTANTE:** 
A senha contém `!` (exclamação). Use SEMPRE o formato com `PGPASSWORD` como variável de ambiente separada, **NÃO coloque a senha na connection string URI** para evitar problemas de escaping no bash.

### **Formato correto:**
```bash
PGPASSWORD='LigareDB_2026!Sec' psql -h db.jqofecfrqppsemupwjbm.supabase.co -p 5432 -U postgres -d postgres -c "SQL"
```

### **Formato ERRADO (vai dar problema):**
```bash
# ❌ NÃO USE — o ! vai ser interpretado pelo bash
psql "postgresql://postgres:LigareDB_2026!Sec@db.jqofecfrqppsemupwjbm.supabase.co:5432/postgres"
```

---

## 📝 EXEMPLOS DE USO

### **Executar query simples:**
```bash
PGPASSWORD='LigareDB_2026!Sec' psql -h db.jqofecfrqppsemupwjbm.supabase.co -p 5432 -U postgres -d postgres \
  -c "SELECT * FROM auth.users LIMIT 5;"
```

### **Executar arquivo de migration:**
```bash
PGPASSWORD='LigareDB_2026!Sec' psql -h db.jqofecfrqppsemupwjbm.supabase.co -p 5432 -U postgres -d postgres \
  -f supabase/migrations/001_initial_schema.sql
```

### **Executar múltiplos comandos:**
```bash
PGPASSWORD='LigareDB_2026!Sec' psql -h db.jqofecfrqppsemupwjbm.supabase.co -p 5432 -U postgres -d postgres <<EOF
CREATE TABLE IF NOT EXISTS test (id INT);
INSERT INTO test VALUES (1);
SELECT * FROM test;
DROP TABLE test;
EOF
```

### **Listar tabelas:**
```bash
PGPASSWORD='LigareDB_2026!Sec' psql -h db.jqofecfrqppsemupwjbm.supabase.co -p 5432 -U postgres -d postgres \
  -c "\dt public.*"
```

### **Ver estrutura de uma tabela:**
```bash
PGPASSWORD='LigareDB_2026!Sec' psql -h db.jqofecfrqppsemupwjbm.supabase.co -p 5432 -U postgres -d postgres \
  -c "\d nome_da_tabela"
```

### **Ver policies RLS:**
```bash
PGPASSWORD='LigareDB_2026!Sec' psql -h db.jqofecfrqppsemupwjbm.supabase.co -p 5432 -U postgres -d postgres \
  -c "SELECT tablename, policyname, cmd FROM pg_policies ORDER BY tablename;"
```

---

## 🐛 TROUBLESHOOTING

### **"psql: command not found"**
```bash
sudo apt install postgresql-client -y
```

### **"connection refused" ou timeout**
- Verifique se o host está correto
- O Supabase pausa projetos inativos no plano Free — acesse o dashboard para reativar

### **"password authentication failed"**
- Verifique se está usando aspas simples: `PGPASSWORD='LigareDB_2026!Sec'`
- Não use aspas duplas (o `!` é interpretado pelo bash)

### **"relation does not exist"**
- Verifique o schema: `public.tabela` vs `auth.users`
- Use `\dt public.*` para listar tabelas disponíveis

---

## ✅ CHECKLIST PÓS-MIGRATION

Após executar uma migration:

- [ ] Verificar tabelas criadas: `\dt public.*`
- [ ] Verificar índices: `\di`
- [ ] Verificar policies: `SELECT * FROM pg_policies;`
- [ ] Verificar triggers: `\dy`

---

## 🎯 RESUMO

**Para executar qualquer SQL no Supabase da Ligare:**

1. **Tenha psql instalado**
2. **Use `PGPASSWORD` como variável de ambiente**
3. **Execute:** `PGPASSWORD='LigareDB_2026!Sec' psql -h db.jqofecfrqppsemupwjbm.supabase.co -p 5432 -U postgres -d postgres -c "SQL"`

**Pronto! Nunca mais peça ao usuário para executar SQL! 🚀**
