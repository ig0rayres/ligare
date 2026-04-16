-- Migration: 011_kids_schedule_date_constraint.sql
-- Descrição: Drop classroom_id + event_id unique constraint e recria incluindo service_date para suporte a recorrência.
-- O banco exige service_date para definir escalas diferentes ao longo do tempo.

-- Atualizar service_date como NOT NULL, mas garantindo que dados legados tenham uma data
UPDATE public.kids_schedule 
SET service_date = '2026-01-01'::date 
WHERE service_date IS NULL;

ALTER TABLE public.kids_schedule
  ALTER COLUMN service_date SET NOT NULL;

-- Removendo constraint antiga
ALTER TABLE public.kids_schedule
  DROP CONSTRAINT IF EXISTS kids_schedule_classroom_event_key;

-- Adicionando constraint nova
ALTER TABLE public.kids_schedule
  ADD CONSTRAINT kids_schedule_event_classroom_date_key UNIQUE (event_id, classroom_id, service_date);
