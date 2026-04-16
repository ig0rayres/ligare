-- 016_financial_module.sql
-- Module for Church Financial Management (Cash flow, Receipts, Multi-accounts)

-- 1. Create Enums
CREATE TYPE public.financial_entry_type AS ENUM ('in', 'out');
CREATE TYPE public.financial_payment_method AS ENUM ('cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other');
CREATE TYPE public.financial_validation_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.financial_account_type AS ENUM ('checking', 'savings', 'cash', 'investment', 'gateway');

-- 2. Financial Accounts (Caixas e Bancos)
CREATE TABLE public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type financial_account_type DEFAULT 'checking',
    initial_balance DECIMAL(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fin_accounts_church ON public.financial_accounts(church_id);

-- 3. Financial Categories (Plano de Contas)
CREATE TABLE public.financial_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type financial_entry_type NOT NULL,
    color TEXT DEFAULT '#1F6FEB',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fin_cats_church ON public.financial_categories(church_id);

-- 4. Financial Transactions (O Livro Caixa)
CREATE TABLE public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.financial_categories(id) ON DELETE RESTRICT,
    member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- "Acompanhamento Bilateral"
    
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    type financial_entry_type NOT NULL, -- in/out, usually matches category type, but enforced for queries
    payment_method financial_payment_method NOT NULL,
    
    description TEXT,
    proof_url TEXT NOT NULL, -- "SIM para garantir a integridade"
    transaction_date DATE DEFAULT CURRENT_DATE,
    
    -- Dupla Checagem (Fim de Culto)
    status financial_validation_status DEFAULT 'pending',
    launched_by UUID NOT NULL REFERENCES public.profiles(id),
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fin_trans_church ON public.financial_transactions(church_id);
CREATE INDEX idx_fin_trans_account ON public.financial_transactions(account_id);
CREATE INDEX idx_fin_trans_member ON public.financial_transactions(member_id);
CREATE INDEX idx_fin_trans_date ON public.financial_transactions(transaction_date);

-- 5. RLS Policies

-- Enable RLS
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Helper Function (from 001) is_platform_admin() is available.
-- Admins and Managers can manage accounts and categories
CREATE POLICY "Admins can manage accounts" ON public.financial_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.church_id = financial_accounts.church_id
            AND profiles.role IN ('super_admin', 'admin', 'manager')
        )
    );

CREATE POLICY "Admins can manage categories" ON public.financial_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.church_id = financial_categories.church_id
            AND profiles.role IN ('super_admin', 'admin', 'manager')
        )
    );

-- Leaders/Treasurers can view accounts and categories to make transactions
CREATE POLICY "Leaders can view accounts" ON public.financial_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.church_id = financial_accounts.church_id
        )
    );

CREATE POLICY "Leaders can view categories" ON public.financial_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.church_id = financial_categories.church_id
        )
    );

-- Transactions: Admins manage all, Members view their own
CREATE POLICY "Admins manage all church transactions" ON public.financial_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.church_id = financial_transactions.church_id
            AND profiles.role IN ('super_admin', 'admin', 'manager', 'leader')
        )
    );

CREATE POLICY "Members view own transactions" ON public.financial_transactions
    FOR SELECT USING (
        member_id = auth.uid()
        AND status = 'verified' -- Members only see validated giving
    );

-- 6. Storage Bucket for Receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('financial_receipts', 'financial_receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Requires auth)
CREATE POLICY "Church staff can upload receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'financial_receipts'
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'manager', 'leader')
    )
);

CREATE POLICY "Church staff can view receipts"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'financial_receipts'
    -- Em produção, nós armazenaremos o path como "church_id/filename.ext". 
    -- Para segurança forte via RLS do Storage, validamos se o arquivo pertence a church do usuario.
);

-- Seed Categories Script Helper (Runs on Tenant Creation dynamically via API, but we put default values if needed)
