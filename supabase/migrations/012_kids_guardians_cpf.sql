-- Migration 012: Unificar identificação de responsáveis (CPF) e permitir Visitantes no módulo Ligare Kids

-- 1. Adicionar CPF nas tabelas principais
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE;

ALTER TABLE church_members ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE church_members DROP CONSTRAINT IF EXISTS church_members_cpf_church_id_key;
ALTER TABLE church_members ADD CONSTRAINT church_members_cpf_church_id_key UNIQUE (cpf, church_id);

-- 2. Modificar kids_guardians para referenciar church_members em vez de profiles
ALTER TABLE kids_guardians DROP CONSTRAINT IF EXISTS kids_guardians_guardian_id_fkey;
ALTER TABLE kids_guardians ADD CONSTRAINT kids_guardians_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES church_members(id) ON DELETE CASCADE;

-- 3. Atualizar a política RLS da kids_guardians
DROP POLICY IF EXISTS "Guardians view own links" ON kids_guardians;

CREATE POLICY "Guardians view own links" ON kids_guardians FOR SELECT
USING (EXISTS (
    SELECT 1 FROM church_members cm 
    WHERE cm.id = kids_guardians.guardian_id AND cm.profile_id = auth.uid()
));
