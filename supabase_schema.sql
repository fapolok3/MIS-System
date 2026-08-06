-- ============================================================
-- Supabase Database Schema for MIS Management System
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pgzlfirdycocxzxekhbo/sql
-- ============================================================

-- 1. Devices Table
CREATE TABLE IF NOT EXISTS public.devices (
  sl BIGINT PRIMARY KEY,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'LIVE',
  sol TEXT,
  location TEXT NOT NULL,
  id TEXT,
  sim TEXT,
  operator TEXT,
  floor TEXT,
  placement TEXT,
  access_type TEXT,
  bm TEXT,
  price TEXT,
  district TEXT,
  install_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Service Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  subject TEXT,
  from_user TEXT,
  req_date TEXT,
  req_time TEXT,
  plan_date TEXT,
  count_date TEXT,
  prov_date TEXT,
  location TEXT,
  device_id TEXT,
  loc_type TEXT,
  issue_type TEXT,
  received_by TEXT,
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'OPEN',
  res_time INT DEFAULT 0,
  sla_threshold INT DEFAULT 24,
  sla_status TEXT,
  tech TEXT,
  remarks TEXT,
  email_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Purchase Orders Table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  qty INT DEFAULT 1,
  total_price TEXT DEFAULT '0',
  issue_date TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SIM Inventory Table
CREATE TABLE IF NOT EXISTS public.sim_inventory (
  id TEXT PRIMARY KEY,
  sim_number TEXT NOT NULL,
  operator TEXT NOT NULL,
  assigned_device TEXT,
  location TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Category Groups Table
CREATE TABLE IF NOT EXISTS public.category_groups (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User Credentials Table
CREATE TABLE IF NOT EXISTS public.user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Create Permissive Policies for Client (Anon Key) Access
DROP POLICY IF EXISTS "Allow public full access on devices" ON public.devices;
CREATE POLICY "Allow public full access on devices" ON public.devices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access on tickets" ON public.tickets;
CREATE POLICY "Allow public full access on tickets" ON public.tickets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access on purchase_orders" ON public.purchase_orders;
CREATE POLICY "Allow public full access on purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access on sim_inventory" ON public.sim_inventory;
CREATE POLICY "Allow public full access on sim_inventory" ON public.sim_inventory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access on category_groups" ON public.category_groups;
CREATE POLICY "Allow public full access on category_groups" ON public.category_groups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access on user_credentials" ON public.user_credentials;
CREATE POLICY "Allow public full access on user_credentials" ON public.user_credentials FOR ALL USING (true) WITH CHECK (true);

-- Seed Default Admin Account into user_credentials
INSERT INTO public.user_credentials (email, password, role, full_name)
VALUES ('admin@local.com', 'admin123', 'admin', 'System Administrator')
ON CONFLICT (email) DO NOTHING;
