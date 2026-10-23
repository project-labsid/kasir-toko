-- ==============================================================================
-- SUPER KASIR TOKO - INITIAL SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Target: PostgreSQL / Supabase
-- Multi-Tenant POS & Store Management System
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUMS & DOMAINS
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE platform_role_type AS ENUM ('super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE org_role_type AS ENUM ('owner', 'manager', 'cashier');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE account_status_type AS ENUM ('pending_verification', 'active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE movement_type_type AS ENUM ('sale', 'purchase', 'adjustment', 'return_in', 'return_out');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('cash', 'transfer', 'qris', 'debit', 'credit');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 3. CORE USER & PLATFORM TABLES
-- ==============================================================================

-- Profiles linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Super admin table (protected, never self-assignable)
CREATE TABLE IF NOT EXISTS public.platform_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role platform_role_type NOT NULL DEFAULT 'super_admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 4. ORGANIZATIONS & TENANT MEMBERSHIP
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id),
    status account_status_type NOT NULL DEFAULT 'active',
    timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    currency_code TEXT NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role org_role_type NOT NULL DEFAULT 'cashier',
    status account_status_type NOT NULL DEFAULT 'active',
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    intended_role org_role_type NOT NULL DEFAULT 'cashier',
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 5. MASTER CATALOG & INVENTORY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 5,
    image_path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT unique_org_sku UNIQUE (organization_id, sku)
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type movement_type_type NOT NULL,
    quantity_delta INTEGER NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    reason TEXT,
    actor_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 6. CONTACTS: CUSTOMERS & SUPPLIERS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 7. PURCHASES & INBOUND STOCK
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    purchase_number TEXT NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'completed',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT unique_org_purchase_no UNIQUE (organization_id, purchase_number)
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(15, 2) NOT NULL,
    line_total NUMERIC(15, 2) NOT NULL
);

-- ==============================================================================
-- 8. SALES & TRANSACTIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    transaction_number TEXT NOT NULL,
    cashier_user_id UUID NOT NULL REFERENCES auth.users(id),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'paid',
    status TEXT NOT NULL DEFAULT 'completed',
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT unique_org_trans_no UNIQUE (organization_id, transaction_number)
);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name_snapshot TEXT NOT NULL,
    sku_snapshot TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL,
    unit_cost_snapshot NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(15, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    payment_method payment_method_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 9. RETURNS & EXPENSES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE RESTRICT,
    return_number TEXT NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    processed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT unique_org_return_no UNIQUE (organization_id, return_number)
);

CREATE TABLE IF NOT EXISTS public.return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
    sale_item_id UUID NOT NULL REFERENCES public.sale_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    refund_amount NUMERIC(15, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Operasional',
    amount NUMERIC(15, 2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 10. SETTINGS & AUDIT LOGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.store_settings (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    receipt_header TEXT DEFAULT 'Terima Kasih Atas Kunjungan Anda',
    receipt_footer TEXT DEFAULT 'Barang yang sudah dibeli tidak dapat ditukar kecuali ada perjanjian.',
    tax_percentage NUMERIC(5, 2) DEFAULT 0.00,
    enable_tax BOOLEAN DEFAULT false,
    discount_rules JSONB DEFAULT '{"max_cashier_discount_percent": 10}'::jsonb,
    inventory_rules JSONB DEFAULT '{"allow_negative_stock": false}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.platform_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES public.organizations(id),
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 11. INDEXES FOR MULTI-TENANT QUERY OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(organization_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(organization_id, barcode);
CREATE INDEX IF NOT EXISTS idx_sales_org_date ON public.sales(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_org_sale ON public.sale_items(organization_id, sale_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_org ON public.inventory_movements(organization_id, product_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id, created_at DESC);

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================

-- Check if current user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Check if current user has active membership in organization with specified roles
CREATE OR REPLACE FUNCTION public.has_org_role(org_id UUID, allowed_roles org_role_type[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role = ANY(allowed_roles)
  );
$$;

-- ==============================================================================
-- 13. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_activity_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 14. POLICIES SPECIFICATION
-- ==============================================================================

-- Profiles: Users can view and update only their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Platform Roles: Only Super Admins can view
CREATE POLICY "Only super admin can read platform roles"
    ON public.platform_roles FOR SELECT
    USING (is_super_admin());

-- Organizations:
-- Members can view their own organization
CREATE POLICY "Members can view their own organization"
    ON public.organizations FOR SELECT
    USING (
      owner_user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = public.organizations.id
          AND user_id = auth.uid()
          AND status = 'active'
      ) OR
      is_super_admin()
    );

-- Only Owners can update organization
CREATE POLICY "Owners can update their organization"
    ON public.organizations FOR UPDATE
    USING (owner_user_id = auth.uid() AND has_org_role(id, ARRAY['owner'::org_role_type]))
    WITH CHECK (owner_user_id = auth.uid());

-- Organization Members:
CREATE POLICY "Members can view members of their organization"
    ON public.organization_members FOR SELECT
    USING (
      user_id = auth.uid() OR
      has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]) OR
      is_super_admin()
    );

CREATE POLICY "Owners and Managers can manage members"
    ON public.organization_members FOR ALL
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type]))
    WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type]));

-- Products & Catalog:
CREATE POLICY "Org members can view active products"
    ON public.products FOR SELECT
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

CREATE POLICY "Owners and Managers can insert products"
    ON public.products FOR INSERT
    WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type]));

CREATE POLICY "Owners and Managers can update products"
    ON public.products FOR UPDATE
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type]))
    WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type]));

CREATE POLICY "Owners can delete products"
    ON public.products FOR DELETE
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type]));

-- Categories:
CREATE POLICY "Org members can view categories"
    ON public.categories FOR SELECT
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

CREATE POLICY "Owners and Managers can manage categories"
    ON public.categories FOR ALL
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type]))
    WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type]));

-- Sales:
-- Cashiers, managers, owners can view sales of their org
CREATE POLICY "Org members can view sales"
    ON public.sales FOR SELECT
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

-- Only authorized POS RPC or Cashier/Manager can insert sales
CREATE POLICY "Org members can insert sales"
    ON public.sales FOR INSERT
    WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

-- Sale Items:
CREATE POLICY "Org members can view sale items"
    ON public.sale_items FOR SELECT
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

CREATE POLICY "Org members can insert sale items"
    ON public.sale_items FOR INSERT
    WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

-- Payments:
CREATE POLICY "Org members can view payments"
    ON public.payments FOR SELECT
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

CREATE POLICY "Org members can insert payments"
    ON public.payments FOR INSERT
    WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

-- Inventory Movements:
CREATE POLICY "Org members can view inventory movements"
    ON public.inventory_movements FOR SELECT
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

CREATE POLICY "Owners and Managers can insert manual stock movements"
    ON public.inventory_movements FOR INSERT
    WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

-- Customers & Suppliers:
CREATE POLICY "Org members can view customers"
    ON public.customers FOR SELECT
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

CREATE POLICY "Org members can insert or update customers"
    ON public.customers FOR ALL
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]))
    WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

CREATE POLICY "Org members can view suppliers"
    ON public.suppliers FOR SELECT
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type]));

CREATE POLICY "Owners and managers can manage suppliers"
    ON public.suppliers FOR ALL
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type]))
    WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type]));

-- Store Settings:
CREATE POLICY "Org members can view store settings"
    ON public.store_settings FOR SELECT
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]));

CREATE POLICY "Only owners can update store settings"
    ON public.store_settings FOR UPDATE
    USING (has_org_role(organization_id, ARRAY['owner'::org_role_type]))
    WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role_type]));

-- Platform Activity Logs (Super Admin only):
CREATE POLICY "Super admin can view platform activity logs"
    ON public.platform_activity_logs FOR SELECT
    USING (is_super_admin());

-- ==============================================================================
-- 15. ATOMIC POS SALE TRANSACTION (RPC FUNCTION)
-- Validates stock, calculates server totals, records snapshot, updates inventory,
-- and enforces tenant boundaries in a single atomic transaction.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.process_pos_sale(
    p_org_id UUID,
    p_customer_id UUID,
    p_items JSONB,              -- Array of {product_id: UUID, quantity: INT}
    p_payment_method payment_method_type,
    p_amount_paid NUMERIC,
    p_idempotency_key TEXT,
    p_discount_total NUMERIC DEFAULT 0.00,
    p_tax_percentage NUMERIC DEFAULT 0.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_sale_id UUID;
    v_trans_number TEXT;
    v_subtotal NUMERIC(15, 2) := 0.00;
    v_tax_amount NUMERIC(15, 2) := 0.00;
    v_total_amount NUMERIC(15, 2) := 0.00;
    v_item RECORD;
    v_prod RECORD;
    v_line_total NUMERIC(15, 2);
    v_existing_sale UUID;
BEGIN
    -- 1. Check idempotency
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing_sale FROM public.sales
        WHERE idempotency_key = p_idempotency_key AND organization_id = p_org_id;
        
        IF v_existing_sale IS NOT NULL THEN
            RETURN jsonb_build_object('success', true, 'sale_id', v_existing_sale, 'idempotent_duplicate', true);
        END IF;
    END IF;

    -- 2. Verify caller membership & role
    IF NOT has_org_role(p_org_id, ARRAY['owner'::org_role_type, 'manager'::org_role_type, 'cashier'::org_role_type]) THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna bukan anggota aktif pada toko ini';
    END IF;

    -- 3. Generate transaction number (e.g. TRX-YYYYMMDD-XXXXX)
    v_trans_number := 'TRX-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

    -- 4. Create sale header first
    INSERT INTO public.sales (
        organization_id,
        transaction_number,
        cashier_user_id,
        customer_id,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        payment_status,
        status,
        idempotency_key
    ) VALUES (
        p_org_id,
        v_trans_number,
        v_user_id,
        p_customer_id,
        0.00,
        COALESCE(p_discount_total, 0.00),
        0.00,
        0.00,
        'paid',
        'completed',
        p_idempotency_key
    ) RETURNING id INTO v_sale_id;

    -- 5. Iterate items with ROW LOCKING (FOR UPDATE) to prevent race conditions
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
    LOOP
        IF v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'Kuantitas item harus lebih dari 0';
        END IF;

        -- Lock product row
        SELECT * INTO v_prod FROM public.products
        WHERE id = v_item.product_id AND organization_id = p_org_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan pada organisasi ini', v_item.product_id;
        END IF;

        IF NOT v_prod.is_active THEN
            RAISE EXCEPTION 'Produk % sedang dinonaktifkan', v_prod.name;
        END IF;

        IF v_prod.current_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Stok untuk produk "%" tidak mencukupi (Tersisa: %, Diminta: %)', 
                v_prod.name, v_prod.current_stock, v_item.quantity;
        END IF;

        -- Calculate line total strictly on server
        v_line_total := round((v_prod.selling_price * v_item.quantity)::numeric, 2);
        v_subtotal := v_subtotal + v_line_total;

        -- Insert sale_item snapshot
        INSERT INTO public.sale_items (
            organization_id,
            sale_id,
            product_id,
            product_name_snapshot,
            sku_snapshot,
            quantity,
            unit_price,
            unit_cost_snapshot,
            discount_amount,
            line_total
        ) VALUES (
            p_org_id,
            v_sale_id,
            v_prod.id,
            v_prod.name,
            v_prod.sku,
            v_item.quantity,
            v_prod.selling_price,
            v_prod.cost_price,
            0.00,
            v_line_total
        );

        -- Deduct inventory
        UPDATE public.products
        SET current_stock = current_stock - v_item.quantity,
            updated_at = timezone('utc', now())
        WHERE id = v_prod.id;

        -- Record inventory movement
        INSERT INTO public.inventory_movements (
            organization_id,
            product_id,
            movement_type,
            quantity_delta,
            reference_type,
            reference_id,
            reason,
            actor_user_id
        ) VALUES (
            p_org_id,
            v_prod.id,
            'sale',
            -v_item.quantity,
            'sale',
            v_sale_id,
            'Penjualan Kasir POS ' || v_trans_number,
            v_user_id
        );
    END LOOP;

    -- 6. Calculate tax and final total
    IF p_tax_percentage > 0 THEN
        v_tax_amount := round(((v_subtotal - COALESCE(p_discount_total, 0.00)) * (p_tax_percentage / 100.0))::numeric, 2);
    END IF;

    v_total_amount := (v_subtotal - COALESCE(p_discount_total, 0.00)) + v_tax_amount;
    IF v_total_amount < 0 THEN
        v_total_amount := 0.00;
    END IF;

    -- Validate payment amount for cash
    IF p_payment_method = 'cash' AND p_amount_paid < v_total_amount THEN
        RAISE EXCEPTION 'Uang pembayaran tunai (Rp %) kurang dari total belanja (Rp %)', p_amount_paid, v_total_amount;
    END IF;

    -- Update final sale totals
    UPDATE public.sales
    SET subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        total_amount = v_total_amount
    WHERE id = v_sale_id;

    -- 7. Record payment
    INSERT INTO public.payments (
        organization_id,
        sale_id,
        payment_method,
        amount,
        status
    ) VALUES (
        p_org_id,
        v_sale_id,
        p_payment_method,
        p_amount_paid,
        'completed'
    );

    -- 8. Audit log
    INSERT INTO public.audit_logs (
        organization_id,
        actor_user_id,
        event_type,
        target_type,
        target_id,
        metadata
    ) VALUES (
        p_org_id,
        v_user_id,
        'sale_completed',
        'sale',
        v_sale_id::text,
        jsonb_build_object(
            'transaction_number', v_trans_number,
            'total_amount', v_total_amount,
            'payment_method', p_payment_method
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'transaction_number', v_trans_number,
        'subtotal', v_subtotal,
        'tax_amount', v_tax_amount,
        'total_amount', v_total_amount,
        'change_due', (p_amount_paid - v_total_amount)
    );
END;
$$;
