-- Migração para adicionar asaas_customer_id na tabela churches
ALTER TABLE public.churches
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;

-- O campo de features_jsonb já existe na tabela subscriptions, e vai lidar com a sessão whatsapp lá
