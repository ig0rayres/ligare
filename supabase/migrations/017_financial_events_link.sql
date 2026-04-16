-- =========================================================================
-- 017_financial_events_link.sql
-- Adiciona a coluna event_id na tabela financial_transactions para permitir
-- lançamentos de receitas originadas em cultos/eventos específicos.
-- =========================================================================

-- Adiciona a coluna event_id vinculando à tabela events
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Cria índice para buscas de transações por evento
CREATE INDEX IF NOT EXISTS idx_financial_transactions_event 
ON public.financial_transactions(event_id);
