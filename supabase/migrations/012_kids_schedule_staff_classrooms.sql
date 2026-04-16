-- Migration: 012_kids_schedule_staff_classrooms.sql
-- Descrição: Move classroom_id de kids_schedule para kids_schedule_staff.
-- Assim, uma escala é apenas o Evento+Data, e cada voluntário é associado individualmente a uma sala (ou nulo para apoio geral).

-- 1. Remover foreign key e constraint de kids_schedule
ALTER TABLE public.kids_schedule DROP CONSTRAINT IF EXISTS kids_schedule_classroom_id_fkey;
ALTER TABLE public.kids_schedule DROP CONSTRAINT IF EXISTS kids_schedule_classroom_event_date_key;
ALTER TABLE public.kids_schedule DROP CONSTRAINT IF EXISTS kids_schedule_event_classroom_date_key;

-- 2. Adicionar nova tabela relacional kids_schedule_staff -> kids_classrooms
ALTER TABLE public.kids_schedule_staff ADD COLUMN classroom_id uuid REFERENCES public.kids_classrooms(id) ON DELETE SET NULL;

-- 3. Migrar dados existentes: para cada staff, atribuir a sala do schedule_id correspondente
UPDATE public.kids_schedule_staff kss
SET classroom_id = ks.classroom_id
FROM public.kids_schedule ks
WHERE kss.schedule_id = ks.id;

-- 4. Excluir a constraint antiga de (schedule_id, profile_id) porque o mesmo membro poderia servir em duas salas no mesmo culto (mesmo q raro), 
-- ou então manter a constraint pq um membro só pode estar em uma sala no mesmo dia. 
-- Mantendo a unique (schedule, profile) protege que a mesma pessoa nao seja inserida 2x na mesma escala.
-- Deixaremos a atual funcionar.

-- 5. Agora podemos dropar a coluna classroom_id da tabela kids_schedule seguramente
ALTER TABLE public.kids_schedule DROP COLUMN classroom_id;

-- 6. Adicionar constraint garantindo que so exista UMA escala por evento/data/kids_schedule
ALTER TABLE public.kids_schedule ADD CONSTRAINT kids_schedule_event_date_key UNIQUE (event_id, service_date);
