import { createClient } from '@supabase/supabase-js';
import { Device, Ticket, PurchaseOrder, SIMItem, CategoryGroup, SystemOptions } from '../types';
import { initialSystemOptions } from '../data/initialData';

const env = (import.meta as any).env || {};

const SUPABASE_URL =
  env.VITE_SUPABASE_URL || 'https://pgzlfirdycocxzxekhbo.supabase.co';
const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnemxmaXJkeWNvY3h6eGVraGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDU3NTUsImV4cCI6MjEwMTU4MTc1NX0.CouM4ppJIbjNhVhxv5VPoi3z6lVzKmCcQsS7uc_xBPY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface DbUserCredential {
  id?: string;
  email: string;
  password: string;
  role?: string;
  full_name?: string;
}

// -------------------------------------------------------------
// DEVICES
// -------------------------------------------------------------
export async function fetchSupabaseDevices(): Promise<Device[] | null> {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('sl', { ascending: false });

    if (error) {
      console.warn('Supabase fetchDevices warning:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((d: any) => ({
      sl: Number(d.sl),
      category: d.category || '',
      status: d.status || 'LIVE',
      sol: d.sol || '',
      location: d.location || '',
      id: d.id || '',
      sim: d.sim || '',
      operator: d.operator || 'GP',
      floor: d.floor || '',
      placement: d.placement || '',
      accessType: d.access_type || '',
      bm: d.bm || '',
      price: d.price || '',
      district: d.district || '',
      installDate: d.install_date || '',
    }));
  } catch (err) {
    console.warn('Supabase fetchDevices catch error:', err);
    return null;
  }
}

export async function insertSupabaseDevice(device: Device): Promise<boolean> {
  try {
    const row = {
      sl: device.sl,
      category: device.category,
      status: device.status,
      sol: device.sol,
      location: device.location,
      id: device.id,
      sim: device.sim,
      operator: device.operator,
      floor: device.floor,
      placement: device.placement,
      access_type: device.accessType,
      bm: device.bm,
      price: device.price,
      district: device.district,
      install_date: device.installDate,
    };
    const { error } = await supabase.from('devices').upsert([row]);
    if (error) {
      console.warn('Supabase insertDevice error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase insertDevice catch error:', err);
    return false;
  }
}

export async function bulkInsertSupabaseDevices(devices: Device[]): Promise<boolean> {
  try {
    const rows = devices.map((device) => ({
      sl: device.sl,
      category: device.category,
      status: device.status,
      sol: device.sol,
      location: device.location,
      id: device.id,
      sim: device.sim,
      operator: device.operator,
      floor: device.floor,
      placement: device.placement,
      access_type: device.accessType,
      bm: device.bm,
      price: device.price,
      district: device.district,
      install_date: device.installDate,
    }));
    const { error } = await supabase.from('devices').upsert(rows);
    if (error) {
      console.warn('Supabase bulkInsertDevices error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkInsertDevices catch error:', err);
    return false;
  }
}

export async function deleteSupabaseDevice(sl: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('devices').delete().eq('sl', sl);
    if (error) {
      console.warn('Supabase deleteDevice error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteDevice catch error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// TICKETS
// -------------------------------------------------------------
export async function fetchSupabaseTickets(): Promise<Ticket[] | null> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.warn('Supabase fetchTickets warning:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((t: any) => ({
      id: t.id || '',
      subject: t.subject || '',
      from: t.from_user || '',
      reqDate: t.req_date || '',
      reqTime: t.req_time || '',
      planDate: t.plan_date || '',
      countDate: t.count_date || '',
      provDate: t.prov_date || '',
      location: t.location || '',
      deviceId: t.device_id || '',
      locType: t.loc_type || '',
      issueType: t.issue_type || '',
      receivedBy: t.received_by || '',
      priority: t.priority || 'MEDIUM',
      status: t.status || 'OPEN',
      resTime: Number(t.res_time) || 0,
      slaThreshold: Number(t.sla_threshold) || 24,
      slaStatus: t.sla_status || '',
      tech: t.tech || '',
      remarks: t.remarks || '',
      emailDetails: t.email_details || '',
    }));
  } catch (err) {
    console.warn('Supabase fetchTickets catch error:', err);
    return null;
  }
}

export async function insertSupabaseTicket(ticket: Ticket): Promise<boolean> {
  try {
    const row = {
      id: ticket.id,
      subject: ticket.subject,
      from_user: ticket.from,
      req_date: ticket.reqDate,
      req_time: ticket.reqTime,
      plan_date: ticket.planDate,
      count_date: ticket.countDate,
      prov_date: ticket.provDate,
      location: ticket.location,
      device_id: ticket.deviceId,
      loc_type: ticket.locType,
      issue_type: ticket.issueType,
      received_by: ticket.receivedBy,
      priority: ticket.priority,
      status: ticket.status,
      res_time: ticket.resTime,
      sla_threshold: ticket.slaThreshold,
      sla_status: ticket.slaStatus,
      tech: ticket.tech,
      remarks: ticket.remarks,
      email_details: ticket.emailDetails,
    };
    const { error } = await supabase.from('tickets').upsert([row]);
    if (error) {
      console.warn('Supabase insertTicket error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase insertTicket catch error:', err);
    return false;
  }
}

export async function deleteSupabaseTicket(id: string | number): Promise<boolean> {
  try {
    const { error } = await supabase.from('tickets').delete().eq('id', String(id));
    if (error) {
      console.warn('Supabase deleteTicket error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteTicket catch error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// PURCHASE ORDERS (PO)
// -------------------------------------------------------------
export async function fetchSupabasePOs(): Promise<PurchaseOrder[] | null> {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.warn('Supabase fetchPOs warning:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((p: any) => ({
      id: p.id || '',
      poNumber: p.po_number || '',
      vendor: p.vendor || '',
      category: p.category || '',
      qty: Number(p.qty) || 1,
      totalPrice: p.total_price || '0',
      issueDate: p.issue_date || '',
      status: p.status || 'PENDING',
    }));
  } catch (err) {
    console.warn('Supabase fetchPOs catch error:', err);
    return null;
  }
}

export async function insertSupabasePO(po: PurchaseOrder): Promise<boolean> {
  try {
    const row = {
      id: po.id,
      po_number: po.poNumber,
      vendor: po.vendor,
      category: po.category,
      qty: po.qty,
      total_price: po.totalPrice,
      issue_date: po.issueDate,
      status: po.status,
    };
    const { error } = await supabase.from('purchase_orders').upsert([row]);
    if (error) {
      console.warn('Supabase insertPO error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase insertPO catch error:', err);
    return false;
  }
}

export async function deleteSupabasePO(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deletePO error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deletePO catch error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// SIM INVENTORY
// -------------------------------------------------------------
export async function fetchSupabaseSIMs(): Promise<SIMItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('sim_inventory')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.warn('Supabase fetchSIMs warning:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((s: any) => ({
      id: s.id || '',
      simNumber: s.sim_number || '',
      operator: s.operator || '',
      assignedDevice: s.assigned_device || '',
      location: s.location || '',
      status: s.status || 'ACTIVE',
    }));
  } catch (err) {
    console.warn('Supabase fetchSIMs catch error:', err);
    return null;
  }
}

export async function insertSupabaseSIM(sim: SIMItem): Promise<boolean> {
  try {
    const row = {
      id: sim.id,
      sim_number: sim.simNumber,
      operator: sim.operator,
      assigned_device: sim.assignedDevice,
      location: sim.location,
      status: sim.status,
    };
    const { error } = await supabase.from('sim_inventory').upsert([row]);
    if (error) {
      console.warn('Supabase insertSIM error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase insertSIM catch error:', err);
    return false;
  }
}

export async function deleteSupabaseSIM(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('sim_inventory').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteSIM error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteSIM catch error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// CATEGORY GROUPS
// -------------------------------------------------------------
export async function fetchSupabaseCategoryGroups(): Promise<CategoryGroup[] | null> {
  try {
    const { data, error } = await supabase
      .from('category_groups')
      .select('*');

    if (error) {
      console.warn('Supabase fetchCategoryGroups warning:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((cg: any) => ({
      id: cg.id,
      title: cg.title,
      icon: cg.icon,
      items: Array.isArray(cg.items) ? cg.items : [],
    }));
  } catch (err) {
    console.warn('Supabase fetchCategoryGroups catch error:', err);
    return null;
  }
}

export async function saveSupabaseCategoryGroups(groups: CategoryGroup[]): Promise<boolean> {
  try {
    const rows = groups.map((g) => ({
      id: g.id,
      title: g.title,
      icon: g.icon || '',
      items: g.items,
    }));
    const { error } = await supabase.from('category_groups').upsert(rows);
    if (error) {
      console.warn('Supabase saveCategoryGroups error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveCategoryGroups catch error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// SYSTEM OPTIONS
// -------------------------------------------------------------
export async function fetchSupabaseSystemOptions(): Promise<SystemOptions | null> {
  try {
    const { data, error } = await supabase
      .from('system_options')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetchSystemOptions warning:', error.message);
      return null;
    }

    if (!data) return null;

    if (data.options && typeof data.options === 'object') {
      return { ...initialSystemOptions, ...data.options };
    }

    return {
      deviceStatuses: Array.isArray(data.device_statuses) ? data.device_statuses : initialSystemOptions.deviceStatuses,
      simOperators: Array.isArray(data.sim_operators) ? data.sim_operators : initialSystemOptions.simOperators,
      accessTypes: Array.isArray(data.access_types) ? data.access_types : initialSystemOptions.accessTypes,
      locationTypes: Array.isArray(data.location_types) ? data.location_types : initialSystemOptions.locationTypes,
      issueTypes: Array.isArray(data.issue_types) ? data.issue_types : initialSystemOptions.issueTypes,
      ticketPriorities: Array.isArray(data.ticket_priorities) ? data.ticket_priorities : initialSystemOptions.ticketPriorities,
      ticketStatuses: Array.isArray(data.ticket_statuses) ? data.ticket_statuses : initialSystemOptions.ticketStatuses,
      vendors: Array.isArray(data.vendors) ? data.vendors : initialSystemOptions.vendors,
      poStatuses: Array.isArray(data.po_statuses) ? data.po_statuses : initialSystemOptions.poStatuses,
      simStatuses: Array.isArray(data.sim_statuses) ? data.sim_statuses : initialSystemOptions.simStatuses,
      technicians: Array.isArray(data.technicians) ? data.technicians : initialSystemOptions.technicians,
    };
  } catch (err) {
    console.warn('Supabase fetchSystemOptions catch error:', err);
    return null;
  }
}

export async function saveSupabaseSystemOptions(options: SystemOptions): Promise<boolean> {
  try {
    const row = {
      id: 'default',
      device_statuses: options.deviceStatuses,
      sim_operators: options.simOperators,
      access_types: options.accessTypes,
      location_types: options.locationTypes,
      issue_types: options.issueTypes,
      ticket_priorities: options.ticketPriorities,
      ticket_statuses: options.ticketStatuses,
      vendors: options.vendors,
      po_statuses: options.poStatuses,
      sim_statuses: options.simStatuses,
      technicians: options.technicians,
      options: options,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('system_options').upsert([row]);
    if (error) {
      console.warn('Supabase saveSystemOptions error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveSystemOptions catch error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// USER CREDENTIALS & AUTH
// -------------------------------------------------------------
export async function verifySupabaseCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; message?: string; role?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('email', emailInput.trim())
      .single();

    if (error || !data) {
      // Fallback if table is empty or not yet seeded
      if (
        emailInput.trim() === 'admin@local.com' &&
        passwordInput === 'admin123'
      ) {
        return { success: true, role: 'admin' };
      }
      return { success: false, message: 'Invalid email or user not found in database.' };
    }

    if (data.password === passwordInput) {
      return { success: true, role: data.role || 'admin' };
    } else {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }
  } catch (err) {
    console.warn('Supabase verifyCredentials catch error:', err);
    if (
      emailInput.trim() === 'admin@local.com' &&
      passwordInput === 'admin123'
    ) {
      return { success: true, role: 'admin' };
    }
    return { success: false, message: 'Connection error during authentication.' };
  }
}

export async function fetchAllUserCredentials(): Promise<DbUserCredential[]> {
  try {
    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function addSupabaseUserCredential(
  email: string,
  password: string,
  role: string = 'admin',
  fullName: string = ''
): Promise<boolean> {
  try {
    const { error } = await supabase.from('user_credentials').insert([
      {
        email: email.trim(),
        password,
        role,
        full_name: fullName,
      },
    ]);
    if (error) {
      console.warn('Supabase addUserCredential error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase addUserCredential catch error:', err);
    return false;
  }
}
