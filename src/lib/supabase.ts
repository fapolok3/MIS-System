import { createClient } from '@supabase/supabase-js';
import {
  Device,
  Ticket,
  PurchaseOrder,
  SIMItem,
  CategoryGroup,
  SystemOptions,
  AppSettings,
  IssueTrackerItem,
} from '../types';
import { initialSystemOptions } from '../data/initialData';

export const defaultAppSettings: AppSettings = {
  appName: 'BBL DM System',
  appLogo: '',
  tagline: 'Enterprise Management Suite',
};

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

export async function bulkDeleteSupabaseDevices(sls: number[]): Promise<boolean> {
  try {
    const { error } = await supabase.from('devices').delete().in('sl', sls);
    if (error) {
      console.warn('Supabase bulkDeleteDevices error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkDeleteDevices catch error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// TICKETS
// -------------------------------------------------------------
// SERVICE TICKETS & SLA TRACKER
// -------------------------------------------------------------
export async function fetchSupabaseTickets(): Promise<Ticket[] | null> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchTickets warning (trying fallback query):', error.message);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('tickets')
        .select('*');
      if (fallbackError) {
        console.warn('Supabase fetchTickets fallback error:', fallbackError.message);
        return null;
      }
      if (!fallbackData) return [];
      return mapSupabaseTickets(fallbackData);
    }

    if (!data) return [];
    return mapSupabaseTickets(data);
  } catch (err) {
    console.warn('Supabase fetchTickets catch error:', err);
    return null;
  }
}

function mapSupabaseTickets(data: any[]): Ticket[] {
  return data.map((t: any) => ({
    id: String(t.id || ''),
    subject: t.subject || t.title || '',
    from: t.from_user || t.from || t.sender || '',
    reqDate: t.req_date || t.reqDate || '',
    reqTime: t.req_time || t.reqTime || '',
    planDate: t.plan_date || t.planDate || '',
    countDate: t.count_date || t.countDate || '',
    provDate: t.prov_date || t.provDate || '',
    location: t.location || '',
    deviceId: t.device_id || t.deviceId || '',
    locType: t.loc_type || t.locType || '',
    issueType: t.issue_type || t.issueType || '',
    receivedBy: t.received_by || t.receivedBy || '',
    priority: t.priority || 'MEDIUM',
    status: t.status || 'OPEN',
    resTime: Number(t.res_time ?? t.resTime) || 0,
    slaThreshold: Number(t.sla_threshold ?? t.slaThreshold) || 24,
    slaStatus: t.sla_status || t.slaStatus || '',
    tech: t.tech || t.technician || '',
    remarks: t.remarks || t.remark || '',
    emailDetails: t.email_details || t.emailDetails || '',
  }));
}

export async function insertSupabaseTicket(ticket: Ticket): Promise<boolean> {
  try {
    const row: Record<string, any> = {
      id: String(ticket.id),
      subject: ticket.subject || '',
      from_user: ticket.from || '',
      req_date: ticket.reqDate || '',
      req_time: ticket.reqTime || '',
      plan_date: ticket.planDate || '',
      count_date: ticket.countDate || '',
      prov_date: ticket.provDate || '',
      location: ticket.location || '',
      device_id: ticket.deviceId || '',
      loc_type: ticket.locType || '',
      issue_type: ticket.issueType || '',
      received_by: ticket.receivedBy || '',
      priority: ticket.priority || 'MEDIUM',
      status: ticket.status || 'OPEN',
      res_time: Number(ticket.resTime) || 0,
      sla_threshold: Number(ticket.slaThreshold) || 24,
      sla_status: ticket.slaStatus || '',
      tech: ticket.tech || '',
      remarks: ticket.remarks || '',
      email_details: ticket.emailDetails || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // First attempt upsert with onConflict
    let { error } = await supabase.from('tickets').upsert([row], { onConflict: 'id' });
    if (error) {
      console.warn('Supabase insertTicket initial error (retrying with simple upsert):', error.message);
      const res = await supabase.from('tickets').upsert([row]);
      error = res.error;
    }
    if (error) {
      console.warn('Supabase insertTicket fallback error (retrying insert):', error.message);
      const res = await supabase.from('tickets').insert([row]);
      if (res.error) {
        console.warn('Supabase insertTicket final insert error:', res.error.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.warn('Supabase insertTicket catch error:', err);
    return false;
  }
}

export async function bulkInsertSupabaseTickets(tickets: Ticket[]): Promise<boolean> {
  try {
    if (!tickets || tickets.length === 0) return true;
    const rows = tickets.map((ticket) => ({
      id: String(ticket.id),
      subject: ticket.subject || '',
      from_user: ticket.from || '',
      req_date: ticket.reqDate || '',
      req_time: ticket.reqTime || '',
      plan_date: ticket.planDate || '',
      count_date: ticket.countDate || '',
      prov_date: ticket.provDate || '',
      location: ticket.location || '',
      device_id: ticket.deviceId || '',
      loc_type: ticket.locType || '',
      issue_type: ticket.issueType || '',
      received_by: ticket.receivedBy || '',
      priority: ticket.priority || 'MEDIUM',
      status: ticket.status || 'OPEN',
      res_time: Number(ticket.resTime) || 0,
      sla_threshold: Number(ticket.slaThreshold) || 24,
      sla_status: ticket.slaStatus || '',
      tech: ticket.tech || '',
      remarks: ticket.remarks || '',
      email_details: ticket.emailDetails || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    let { error } = await supabase.from('tickets').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase bulkInsertTickets onConflict error (retrying upsert):', error.message);
      const res = await supabase.from('tickets').upsert(rows);
      if (res.error) {
        console.warn('Supabase bulkInsertTickets final error:', res.error.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkInsertTickets catch error:', err);
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

export async function bulkDeleteSupabaseTickets(ids: (string | number)[]): Promise<boolean> {
  try {
    const stringIds = ids.map(String);
    const { error } = await supabase.from('tickets').delete().in('id', stringIds);
    if (error) {
      console.warn('Supabase bulkDeleteTickets error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkDeleteTickets catch error:', err);
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

export async function bulkDeleteSupabasePOs(ids: string[]): Promise<boolean> {
  try {
    const { error } = await supabase.from('purchase_orders').delete().in('id', ids);
    if (error) {
      console.warn('Supabase bulkDeletePOs error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkDeletePOs catch error:', err);
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

export async function bulkDeleteSupabaseSIMs(ids: string[]): Promise<boolean> {
  try {
    const { error } = await supabase.from('sim_inventory').delete().in('id', ids);
    if (error) {
      console.warn('Supabase bulkDeleteSIMs error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkDeleteSIMs catch error:', err);
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

    if (!data || data.length === 0) return null;

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

export async function deleteSupabaseCategoryGroup(groupId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('category_groups').delete().eq('id', groupId);
    if (error) {
      console.warn('Supabase deleteCategoryGroup error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteCategoryGroup catch error:', err);
    return false;
  }
}

export async function saveSupabaseCategoryGroups(groups: CategoryGroup[]): Promise<boolean> {
  try {
    // 1. Check for deleted groups in DB and clean them up
    try {
      const { data: existingData } = await supabase.from('category_groups').select('id');
      if (existingData && Array.isArray(existingData)) {
        const currentGroupIds = new Set(groups.map((g) => g.id));
        const idsToDelete = existingData
          .map((row: any) => row.id)
          .filter((id: string) => !currentGroupIds.has(id));

        if (idsToDelete.length > 0) {
          await supabase.from('category_groups').delete().in('id', idsToDelete);
        }
      }
    } catch (cleanErr) {
      console.warn('Supabase clean deleted category groups warning:', cleanErr);
    }

    if (groups.length > 0) {
      const rows = groups.map((g) => ({
        id: g.id,
        title: g.title,
        icon: g.icon || '',
        items: g.items || [],
      }));
      const { error } = await supabase.from('category_groups').upsert(rows);
      if (error) {
        console.warn('Supabase saveCategoryGroups error:', error.message);
        return false;
      }
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
      return {
        ...initialSystemOptions,
        ...data.options,
        deviceStatuses: Array.isArray(data.options.deviceStatuses) && data.options.deviceStatuses.length > 0 ? data.options.deviceStatuses : (Array.isArray(data.device_statuses) ? data.device_statuses : initialSystemOptions.deviceStatuses),
        simOperators: Array.isArray(data.options.simOperators) && data.options.simOperators.length > 0 ? data.options.simOperators : (Array.isArray(data.sim_operators) ? data.sim_operators : initialSystemOptions.simOperators),
        accessTypes: Array.isArray(data.options.accessTypes) && data.options.accessTypes.length > 0 ? data.options.accessTypes : (Array.isArray(data.access_types) ? data.access_types : initialSystemOptions.accessTypes),
        locationTypes: Array.isArray(data.options.locationTypes) && data.options.locationTypes.length > 0 ? data.options.locationTypes : (Array.isArray(data.location_types) ? data.location_types : initialSystemOptions.locationTypes),
        issueTypes: Array.isArray(data.options.issueTypes) && data.options.issueTypes.length > 0 ? data.options.issueTypes : (Array.isArray(data.issue_types) ? data.issue_types : initialSystemOptions.issueTypes),
        ticketPriorities: Array.isArray(data.options.ticketPriorities) && data.options.ticketPriorities.length > 0 ? data.options.ticketPriorities : (Array.isArray(data.ticket_priorities) ? data.ticket_priorities : initialSystemOptions.ticketPriorities),
        ticketStatuses: Array.isArray(data.options.ticketStatuses) && data.options.ticketStatuses.length > 0 ? data.options.ticketStatuses : (Array.isArray(data.ticket_statuses) ? data.ticket_statuses : initialSystemOptions.ticketStatuses),
        vendors: Array.isArray(data.options.vendors) && data.options.vendors.length > 0 ? data.options.vendors : (Array.isArray(data.vendors) ? data.vendors : initialSystemOptions.vendors),
        poStatuses: Array.isArray(data.options.poStatuses) && data.options.poStatuses.length > 0 ? data.options.poStatuses : (Array.isArray(data.po_statuses) ? data.po_statuses : initialSystemOptions.poStatuses),
        simStatuses: Array.isArray(data.options.simStatuses) && data.options.simStatuses.length > 0 ? data.options.simStatuses : (Array.isArray(data.sim_statuses) ? data.sim_statuses : initialSystemOptions.simStatuses),
        technicians: Array.isArray(data.options.technicians) && data.options.technicians.length > 0 ? data.options.technicians : (Array.isArray(data.technicians) ? data.technicians : initialSystemOptions.technicians),
        slaStatuses: Array.isArray(data.options.slaStatuses) && data.options.slaStatuses.length > 0 ? data.options.slaStatuses : (Array.isArray(data.sla_statuses) ? data.sla_statuses : initialSystemOptions.slaStatuses),
      };
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
      slaStatuses: Array.isArray(data.sla_statuses)
        ? data.sla_statuses
        : Array.isArray(data.options?.slaStatuses)
        ? data.options.slaStatuses
        : initialSystemOptions.slaStatuses,
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
      sla_statuses: options.slaStatuses || initialSystemOptions.slaStatuses,
      options: options,
      updated_at: new Date().toISOString(),
    };
    
    // First attempt full upsert
    const { error } = await supabase.from('system_options').upsert([row], { onConflict: 'id' });
    if (error) {
      console.warn('Supabase saveSystemOptions initial attempt warning:', error.message);
      // Fallback: try upserting with only basic/JSON structure if specific columns are absent in older schema
      const fallbackRow = {
        id: 'default',
        options: options,
        updated_at: new Date().toISOString(),
      };
      const { error: fallbackErr } = await supabase.from('system_options').upsert([fallbackRow], { onConflict: 'id' });
      if (fallbackErr) {
        console.warn('Supabase saveSystemOptions fallback error:', fallbackErr.message);
        return false;
      }
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

// -------------------------------------------------------------
// APP SETTINGS & BRANDING (LOGO & SYSTEM NAME)
// -------------------------------------------------------------
export async function fetchSupabaseAppSettings(): Promise<AppSettings | null> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetchAppSettings warning:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      appName: data.app_name || defaultAppSettings.appName,
      appLogo: data.app_logo || '',
      tagline: data.tagline || defaultAppSettings.tagline,
    };
  } catch (err) {
    console.warn('Supabase fetchAppSettings catch error:', err);
    return null;
  }
}

export async function saveSupabaseAppSettings(settings: AppSettings): Promise<boolean> {
  try {
    const row = {
      id: 'global',
      app_name: settings.appName || defaultAppSettings.appName,
      app_logo: settings.appLogo || '',
      tagline: settings.tagline || defaultAppSettings.tagline,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('app_settings').upsert([row]);
    if (error) {
      console.warn('Supabase saveAppSettings error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveAppSettings catch error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// ISSUE TRACKER & ISSUE REPORTS
// -------------------------------------------------------------
export async function fetchSupabaseIssues(): Promise<IssueTrackerItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchIssues warning:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id || `ISSUE-${Date.now()}`,
      branchName: d.branch_name || '',
      issueType: d.issue_type || '',
      category: d.category || '',
      odooTicketId: d.odoo_ticket_id || '',
      priority: d.priority || 'MEDIUM',
      deviceReplace: d.device_replace === 'YES' || d.device_replace === true ? 'YES' : 'NO',
      replaceDeviceId: d.replace_device_id || '',
      oldDeviceId: d.old_device_id || '',
      location: d.location || '',
      assignPerson: d.assign_person || '',
      status: d.status || 'OPEN',
      date: d.date || '',
      clientReportingDate: d.client_reporting_date || '',
      clientReportingTime: d.client_reporting_time || '',
      clientResponseDate: d.client_response_date || '',
      clientResponseTime: d.client_response_time || '',
      resolutionDate: d.resolution_date || '',
      resolutionTime: d.resolution_time || '',
      details: d.details || '',
      createdAt: d.created_at || new Date().toISOString(),
      updatedAt: d.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Supabase fetchIssues catch error:', err);
    return null;
  }
}

export async function insertSupabaseIssue(issue: IssueTrackerItem): Promise<boolean> {
  try {
    const row = {
      id: issue.id,
      branch_name: issue.branchName,
      issue_type: issue.issueType,
      category: issue.category,
      odoo_ticket_id: issue.odooTicketId,
      priority: issue.priority,
      device_replace: issue.deviceReplace,
      replace_device_id: issue.replaceDeviceId,
      old_device_id: issue.oldDeviceId,
      location: issue.location,
      assign_person: issue.assignPerson,
      status: issue.status,
      date: issue.date,
      client_reporting_date: issue.clientReportingDate,
      client_reporting_time: issue.clientReportingTime,
      client_response_date: issue.clientResponseDate,
      client_response_time: issue.clientResponseTime,
      resolution_date: issue.resolutionDate,
      resolution_time: issue.resolutionTime,
      details: issue.details,
      created_at: issue.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('issues').upsert([row]);
    if (error) {
      console.warn('Supabase insertIssue error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase insertIssue catch error:', err);
    return false;
  }
}

export async function bulkInsertSupabaseIssues(issues: IssueTrackerItem[]): Promise<boolean> {
  try {
    const rows = issues.map((issue) => ({
      id: issue.id,
      branch_name: issue.branchName,
      issue_type: issue.issueType,
      category: issue.category,
      odoo_ticket_id: issue.odooTicketId,
      priority: issue.priority,
      device_replace: issue.deviceReplace,
      replace_device_id: issue.replaceDeviceId,
      old_device_id: issue.oldDeviceId,
      location: issue.location,
      assign_person: issue.assignPerson,
      status: issue.status,
      date: issue.date,
      client_reporting_date: issue.clientReportingDate,
      client_reporting_time: issue.clientReportingTime,
      client_response_date: issue.clientResponseDate,
      client_response_time: issue.clientResponseTime,
      resolution_date: issue.resolutionDate,
      resolution_time: issue.resolutionTime,
      details: issue.details,
      created_at: issue.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('issues').upsert(rows);
    if (error) {
      console.warn('Supabase bulkInsertIssues error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkInsertIssues catch error:', err);
    return false;
  }
}

export async function deleteSupabaseIssue(issueId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('issues').delete().eq('id', issueId);
    if (error) {
      console.warn('Supabase deleteIssue error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteIssue catch error:', err);
    return false;
  }
}

export async function bulkDeleteSupabaseIssues(issueIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase.from('issues').delete().in('id', issueIds);
    if (error) {
      console.warn('Supabase bulkDeleteIssues error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkDeleteIssues catch error:', err);
    return false;
  }
}

