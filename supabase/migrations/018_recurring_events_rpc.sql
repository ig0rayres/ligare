-- Migration 018: Função para calcular ocorrências recentes de eventos recorrentes
-- Usada pelo módulo financeiro para listar cultos para lançamento de receitas

CREATE OR REPLACE FUNCTION get_recent_event_occurrences(p_church_id UUID, p_limit INT DEFAULT 20)
RETURNS TABLE(id UUID, title TEXT, starts_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    e.id,
    e.title,
    CASE
      WHEN e.recurrence_type = 'weekly' AND e.recurrence_day IS NOT NULL THEN
        (CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int - e.recurrence_day::int + 7) % 7) * INTERVAL '1 day')
        + (e.starts_at::time)
      ELSE e.starts_at
    END AS last_occurrence
  FROM public.events e
  WHERE
    e.church_id = p_church_id
    AND (
      e.recurrence_type = 'weekly'
      OR e.starts_at <= NOW()
    )
  ORDER BY last_occurrence DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_recent_event_occurrences(UUID, INT) TO authenticated;
