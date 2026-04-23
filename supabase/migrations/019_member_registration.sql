-- ========================
-- RPC: Quick Member Registration for Tenants
-- ========================

CREATE OR REPLACE FUNCTION public.register_tenant_member(
  p_subdomain TEXT,
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_whatsapp TEXT
) RETURNS jsonb AS $$
DECLARE
  v_church_id UUID;
BEGIN
  -- 1. Get the church_id from the subdomain
  SELECT id INTO v_church_id
  FROM public.churches
  WHERE subdomain = p_subdomain;

  IF v_church_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Igreja não encontrada para o subdomínio fornecido.');
  END IF;

  -- 2. Create the Member Profile
  INSERT INTO public.profiles (
    id, 
    church_id, 
    full_name, 
    email, 
    whatsapp, 
    role, 
    status
  )
  VALUES (
    p_user_id, 
    v_church_id, 
    p_full_name, 
    p_email, 
    p_whatsapp, 
    'member', 
    'active'
  );

  RETURN jsonb_build_object('status', 'success', 'church_id', v_church_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
