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

-- 7. Bills Table (Bill Tracker & Bill Report)
CREATE TABLE IF NOT EXISTS public.bills (
  id TEXT PRIMARY KEY,
  bill_number TEXT NOT NULL,
  invoice_number TEXT DEFAULT '',
  vendor TEXT DEFAULT '',
  client TEXT DEFAULT 'Black Bank PLC',
  client_location TEXT DEFAULT '',
  description TEXT DEFAULT '',
  bill_type TEXT DEFAULT 'Installation Support',
  amount NUMERIC DEFAULT 0,
  handover_date TEXT DEFAULT '',
  submission_date TEXT DEFAULT '',
  received_date TEXT DEFAULT '',
  payment_date TEXT DEFAULT '',
  status TEXT DEFAULT 'Pending',
  approved_by TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'Bank Transfer',
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Device Support Tickets Table (Device Issue Tracker & Report)
CREATE TABLE IF NOT EXISTS public.device_support_tickets (
  id TEXT PRIMARY KEY,
  sl_no BIGINT,
  device_id TEXT NOT NULL,
  contact_date TEXT DEFAULT '',
  last_communication TEXT DEFAULT '',
  device_location TEXT DEFAULT '',
  issue_type TEXT DEFAULT '',
  responsibility TEXT DEFAULT 'ITL',
  probable_solving_date TEXT DEFAULT '',
  ticket_status TEXT DEFAULT 'No',
  odoo_id TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Issues Table (Issue Tracker & Job Entry Report)
CREATE TABLE IF NOT EXISTS public.issues (
  id TEXT PRIMARY KEY,
  branch_name TEXT,
  location TEXT,
  odoo_ticket_id TEXT,
  status TEXT DEFAULT 'Open',
  priority TEXT DEFAULT 'Medium',
  device_replace BOOLEAN DEFAULT false,
  old_device_id TEXT,
  replace_device_id TEXT,
  date TEXT,
  issue_type TEXT,
  category TEXT,
  details TEXT,
  remarks TEXT,
  client_reporting_date TEXT,
  client_reporting_time TEXT,
  client_response_date TEXT,
  client_response_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Service Tickets Table (Service Ticket Tracker & Service Ticket Report)
CREATE TABLE IF NOT EXISTS public.service_tickets (
  id TEXT PRIMARY KEY,
  issue_number TEXT NOT NULL,
  odoo_id TEXT DEFAULT '',
  email_from TEXT DEFAULT '',
  email_subject TEXT DEFAULT '',
  client TEXT DEFAULT 'Black Bank PLC',
  contact_person TEXT DEFAULT '',
  contact_number TEXT DEFAULT '',
  district TEXT DEFAULT 'Dhaka',
  address TEXT DEFAULT '',
  device_location TEXT DEFAULT '',
  location_type TEXT DEFAULT 'Main Branch',
  device_id TEXT DEFAULT '',
  product TEXT DEFAULT '',
  product_price TEXT DEFAULT '',
  segment TEXT DEFAULT 'Corporate',
  kam TEXT DEFAULT '',
  request_date TEXT DEFAULT '',
  request_time TEXT DEFAULT '',
  planned_date TEXT DEFAULT '',
  service_date TEXT DEFAULT '',
  sla_threshold INT DEFAULT 3,
  resolution_days TEXT DEFAULT '0',
  sla_status TEXT DEFAULT 'Pending',
  issues TEXT DEFAULT '',
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Open',
  replace TEXT DEFAULT 'No',
  replace_device_id TEXT DEFAULT 'N/A',
  assign_person TEXT DEFAULT '',
  accessories TEXT DEFAULT '',
  delivery_option TEXT DEFAULT 'Onsite',
  challan_by TEXT DEFAULT '',
  handed_over_to TEXT DEFAULT '',
  unit_qty INT DEFAULT 1,
  invoice_handover TEXT DEFAULT 'No',
  payment_method TEXT DEFAULT 'Cash',
  vendor_bill TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  visit_email TEXT DEFAULT '',
  comments TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Allow public full access on bills" ON public.bills;
CREATE POLICY "Allow public full access on bills" ON public.bills FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access on device_support_tickets" ON public.device_support_tickets;
CREATE POLICY "Allow public full access on device_support_tickets" ON public.device_support_tickets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access on issues" ON public.issues;
CREATE POLICY "Allow public full access on issues" ON public.issues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access on service_tickets" ON public.service_tickets;
CREATE POLICY "Allow public full access on service_tickets" ON public.service_tickets FOR ALL USING (true) WITH CHECK (true);

-- Seed Default Admin Account into user_credentials
INSERT INTO public.user_credentials (email, password, role, full_name)
VALUES ('admin@local.com', 'admin123', 'admin', 'System Administrator')
ON CONFLICT (email) DO NOTHING;

