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
  DeviceSupportTicket,
  BillItem,
  ServiceTicketItem,
} from '../types';
import { initialSystemOptions, mergeSystemOptions } from '../data/initialData';

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
      remarks: d.bm || d.district || '',
    }));
  } catch (err) {
    console.warn('Supabase fetchDevices catch error:', err);
    return null;
  }
}

export async function insertSupabaseDevice(device: Device): Promise<boolean> {
  try {
    const remarksVal = device.remarks !== undefined ? device.remarks : device.bm;
    const row = {
      sl: device.sl,
      category: device.category,
      status: device.status,
      sol: device.sol,
      location: device.location,
      id: device.id,
      sim: device.sim,
      operator: device.operator,
      floor: device.floor || '',
      placement: device.placement || '',
      access_type: device.accessType,
      bm: remarksVal || '',
      price: device.price,
      district: device.district || remarksVal || '',
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
    const rows = devices.map((device) => {
      const remarksVal = device.remarks !== undefined ? device.remarks : device.bm;
      return {
        sl: device.sl,
        category: device.category,
        status: device.status,
        sol: device.sol,
        location: device.location,
        id: device.id,
        sim: device.sim,
        operator: device.operator,
        floor: device.floor || '',
        placement: device.placement || '',
        access_type: device.accessType,
        bm: remarksVal || '',
        price: device.price,
        district: device.district || remarksVal || '',
        install_date: device.installDate,
      };
    });
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
    id: String(t.id || t.ticket_no || t.ticketNo || ''),
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

export async function insertSupabaseTicket(ticket: Ticket): Promise<{ success: boolean; error?: string }> {
  try {
    const ticketId = String(ticket.id || '').trim();
    if (!ticketId) return { success: false, error: 'Ticket ID is required' };

    const row: Record<string, any> = {
      id: ticketId,
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
      updated_at: new Date().toISOString(),
    };
    
    // Attempt 1: Standard Upsert
    const { error: upsertErr } = await supabase.from('tickets').upsert([row], { onConflict: 'id' });
    if (!upsertErr) {
      return { success: true };
    }

    console.warn('Supabase insertTicket upsert warning:', upsertErr.message);

    // Attempt 2: If from_user column is absent, try with 'from' column
    if (upsertErr.message?.includes('from_user') || upsertErr.message?.includes('column')) {
      try {
        const altRow = { ...row };
        delete altRow.from_user;
        altRow['from'] = ticket.from || '';
        const { error: altErr } = await supabase.from('tickets').upsert([altRow], { onConflict: 'id' });
        if (!altErr) return { success: true };
      } catch (e) {}
    }

    // Attempt 3: Direct Update
    const { error: updateErr } = await supabase.from('tickets').update(row).eq('id', ticketId);
    if (!updateErr) {
      return { success: true };
    }

    // Attempt 4: Direct Insert
    const { error: insertErr } = await supabase.from('tickets').insert([row]);
    if (!insertErr) {
      return { success: true };
    }

    // Attempt 5: Minimal payload (core columns only)
    try {
      const minimalRow = {
        id: ticketId,
        subject: ticket.subject || '',
        status: ticket.status || 'OPEN',
        priority: ticket.priority || 'MEDIUM',
        updated_at: new Date().toISOString(),
      };
      const { error: minErr } = await supabase.from('tickets').upsert([minimalRow], { onConflict: 'id' });
      if (!minErr) return { success: true };
    } catch (e) {}

    const lastErrorMsg = insertErr?.message || updateErr?.message || upsertErr?.message || 'Unknown database error';
    console.error('Supabase insertTicket final failure:', lastErrorMsg);
    return { success: false, error: lastErrorMsg };
  } catch (err: any) {
    console.error('Supabase insertTicket catch exception:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function bulkInsertSupabaseTickets(tickets: Ticket[]): Promise<{ success: boolean; error?: string }> {
  try {
    if (!tickets || tickets.length === 0) return { success: true };
    const rows = tickets.map((ticket) => ({
      id: String(ticket.id || '').trim(),
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
      updated_at: new Date().toISOString(),
    })).filter((r) => r.id);

    if (rows.length === 0) return { success: true };

    let { error } = await supabase.from('tickets').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase bulkInsertTickets onConflict error (retrying):', error.message);
      if (error.message?.includes('from_user') || error.message?.includes('column')) {
        try {
          const altRows = rows.map((r, idx) => {
            const alt = { ...r };
            delete alt.from_user;
            alt['from'] = tickets[idx]?.from || '';
            return alt;
          });
          const altRes = await supabase.from('tickets').upsert(altRows, { onConflict: 'id' });
          if (!altRes.error) return { success: true };
        } catch (e) {}
      }
      const res = await supabase.from('tickets').upsert(rows);
      if (res.error) {
        console.error('Supabase bulkInsertTickets final error:', res.error.message);
        return { success: false, error: res.error.message };
      }
    }
    return { success: true };
  } catch (err: any) {
    console.error('Supabase bulkInsertTickets catch error:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function testSupabaseTicketsTable(): Promise<{ ok: boolean; message: string }> {
  try {
    const testId = `TEST_PING_${Date.now()}`;
    const { error: insertError } = await supabase.from('tickets').insert([
      {
        id: testId,
        subject: 'Ping Test Ticket',
        status: 'OPEN',
        priority: 'LOW',
      },
    ]);

    if (insertError) {
      return {
        ok: false,
        message: `Insert test failed: ${insertError.message} (Code: ${insertError.code || 'N/A'})`,
      };
    }

    // Clean up test record
    await supabase.from('tickets').delete().eq('id', testId);

    return {
      ok: true,
      message: 'Supabase `tickets` table is connected, readable, and writable!',
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Exception testing table: ${err?.message || String(err)}`,
    };
  }
}

export async function deleteSupabaseTicket(id: string | number): Promise<boolean> {
  try {
    const { error } = await supabase.from('tickets').delete().eq('id', String(id).trim());
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
    const stringIds = ids.map((id) => String(id).trim()).filter(Boolean);
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

export async function bulkInsertSupabasePOs(pos: PurchaseOrder[]): Promise<boolean> {
  try {
    const rows = pos.map((po) => ({
      id: po.id,
      po_number: po.poNumber,
      vendor: po.vendor,
      category: po.category,
      qty: po.qty,
      total_price: po.totalPrice,
      issue_date: po.issueDate,
      status: po.status,
    }));
    const { error } = await supabase.from('purchase_orders').upsert(rows);
    if (error) {
      console.warn('Supabase bulkInsertPOs error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkInsertPOs catch error:', err);
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
      .limit(10000)
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
    const { error } = await supabase.from('sim_inventory').upsert([row], { onConflict: 'id' });
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

export async function bulkInsertSupabaseSIMs(sims: SIMItem[]): Promise<boolean> {
  try {
    if (!sims || sims.length === 0) return true;
    const rows = sims.map((sim) => ({
      id: sim.id,
      sim_number: sim.simNumber,
      operator: sim.operator,
      assigned_device: sim.assignedDevice,
      location: sim.location,
      status: sim.status,
    }));

    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      const { error } = await supabase.from('sim_inventory').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase bulkInsertSIMs chunk error:', error.message);
      }
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkInsertSIMs catch error:', err);
    return false;
  }
}

/**
 * Replaces the entire SIM inventory in Supabase with the provided SIM items.
 * Upserts valid SIM items and automatically purges any stale/orphaned/duplicate IDs from Supabase.
 */
export async function syncReplaceSupabaseSIMs(sims: SIMItem[]): Promise<boolean> {
  try {
    // 1. Retrieve all current IDs in sim_inventory (up to 10000 to catch all historical duplicates)
    const { data: existingData, error: fetchErr } = await supabase
      .from('sim_inventory')
      .select('id')
      .limit(10000);

    if (fetchErr) {
      console.warn('Supabase syncReplaceSIMs fetch existing warning:', fetchErr.message);
    }

    const newIds = new Set(sims.map((s) => s.id));
    const existingIds: string[] = (existingData || []).map((r: any) => r.id).filter(Boolean);

    // Identify stale IDs present in Supabase that are not in the new clean list
    const idsToDelete = existingIds.filter((id) => !newIds.has(id));

    // 2. Batch upsert the valid rows
    if (sims.length > 0) {
      const rows = sims.map((sim) => ({
        id: sim.id,
        sim_number: sim.simNumber || '',
        operator: sim.operator || 'GP',
        assigned_device: sim.assignedDevice || '',
        location: sim.location || '',
        status: sim.status || 'ACTIVE',
      }));

      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const { error: upsertErr } = await supabase
          .from('sim_inventory')
          .upsert(chunk, { onConflict: 'id' });
        if (upsertErr) {
          console.warn('Supabase syncReplaceSIMs upsert chunk error:', upsertErr.message);
        }
      }
    }

    // 3. Delete obsolete/orphaned IDs in batches
    if (idsToDelete.length > 0) {
      const deleteBatchSize = 100;
      for (let i = 0; i < idsToDelete.length; i += deleteBatchSize) {
        const chunk = idsToDelete.slice(i, i + deleteBatchSize);
        const { error: deleteErr } = await supabase
          .from('sim_inventory')
          .delete()
          .in('id', chunk);
        if (deleteErr) {
          console.warn('Supabase syncReplaceSIMs delete chunk error:', deleteErr.message);
        }
      }
    }

    return true;
  } catch (err) {
    console.warn('Supabase syncReplaceSIMs catch error:', err);
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

    const jsonOpts: Partial<SystemOptions> =
      data.options && typeof data.options === 'object' ? data.options : {};

    const pickArr = (jsonVal: unknown, colVal: unknown, fallback: string[]) => {
      if (Array.isArray(jsonVal) && jsonVal.length > 0) return jsonVal.map(String);
      if (Array.isArray(colVal) && colVal.length > 0) return colVal.map(String);
      return [...fallback];
    };

    return mergeSystemOptions({
      ...jsonOpts,
      deviceStatuses: pickArr(jsonOpts.deviceStatuses, data.device_statuses, initialSystemOptions.deviceStatuses),
      simOperators: pickArr(jsonOpts.simOperators, data.sim_operators, initialSystemOptions.simOperators),
      accessTypes: pickArr(jsonOpts.accessTypes, data.access_types, initialSystemOptions.accessTypes),
      locationTypes: pickArr(jsonOpts.locationTypes, data.location_types, initialSystemOptions.locationTypes),
      issueTypes: pickArr(jsonOpts.issueTypes, data.issue_types, initialSystemOptions.issueTypes),
      ticketPriorities: pickArr(jsonOpts.ticketPriorities, data.ticket_priorities, initialSystemOptions.ticketPriorities),
      ticketStatuses: pickArr(jsonOpts.ticketStatuses, data.ticket_statuses, initialSystemOptions.ticketStatuses),
      vendors: pickArr(jsonOpts.vendors, data.vendors, initialSystemOptions.vendors),
      poStatuses: pickArr(jsonOpts.poStatuses, data.po_statuses, initialSystemOptions.poStatuses),
      simStatuses: pickArr(jsonOpts.simStatuses, data.sim_statuses, initialSystemOptions.simStatuses),
      technicians: pickArr(jsonOpts.technicians, data.technicians, initialSystemOptions.technicians),
      slaStatuses: pickArr(jsonOpts.slaStatuses, data.sla_statuses, initialSystemOptions.slaStatuses || []),

      deviceIssueTypes: pickArr(jsonOpts.deviceIssueTypes, data.device_issue_types, initialSystemOptions.deviceIssueTypes || []),
      deviceResponsibilities: pickArr(jsonOpts.deviceResponsibilities, data.device_responsibilities, initialSystemOptions.deviceResponsibilities || []),
      deviceIssueStatuses: pickArr(jsonOpts.deviceIssueStatuses, data.device_issue_statuses, initialSystemOptions.deviceIssueStatuses || []),

      serviceLocationTypes: pickArr(jsonOpts.serviceLocationTypes, data.service_location_types, initialSystemOptions.serviceLocationTypes || []),
      serviceSegments: pickArr(jsonOpts.serviceSegments, data.service_segments, initialSystemOptions.serviceSegments || []),
      serviceIssueTypes: pickArr(jsonOpts.serviceIssueTypes, data.service_issue_types, initialSystemOptions.serviceIssueTypes || []),
      servicePriorities: pickArr(jsonOpts.servicePriorities, data.service_priorities, initialSystemOptions.servicePriorities || []),
      serviceTicketStatuses: pickArr(jsonOpts.serviceTicketStatuses, data.service_ticket_statuses, initialSystemOptions.serviceTicketStatuses || []),
      serviceDeliveryOptions: pickArr(jsonOpts.serviceDeliveryOptions, data.service_delivery_options, initialSystemOptions.serviceDeliveryOptions || []),
      servicePaymentMethods: pickArr(jsonOpts.servicePaymentMethods, data.service_payment_methods, initialSystemOptions.servicePaymentMethods || []),

      issueTrackerStatuses: pickArr(jsonOpts.issueTrackerStatuses, data.issue_tracker_statuses, initialSystemOptions.issueTrackerStatuses || []),
      issuePremisesNames: pickArr(jsonOpts.issuePremisesNames, data.issue_premises_names, initialSystemOptions.issuePremisesNames || []),
      issuePriorityLevels: pickArr(jsonOpts.issuePriorityLevels, data.issue_priority_levels, initialSystemOptions.issuePriorityLevels || []),

      billPaymentStatuses: pickArr(jsonOpts.billPaymentStatuses, data.bill_payment_statuses, initialSystemOptions.billPaymentStatuses || []),
      billPaymentMethods: pickArr(jsonOpts.billPaymentMethods, data.bill_payment_methods, initialSystemOptions.billPaymentMethods || []),
    });
  } catch (err) {
    console.warn('Supabase fetchSystemOptions catch error:', err);
    return null;
  }
}

export async function saveSupabaseSystemOptions(options: SystemOptions): Promise<boolean> {
  try {
    const normalized = mergeSystemOptions(options);
    const fullRow = {
      id: 'default',
      device_statuses: normalized.deviceStatuses,
      sim_operators: normalized.simOperators,
      access_types: normalized.accessTypes,
      location_types: normalized.locationTypes,
      issue_types: normalized.issueTypes,
      ticket_priorities: normalized.ticketPriorities,
      ticket_statuses: normalized.ticketStatuses,
      vendors: normalized.vendors,
      po_statuses: normalized.poStatuses,
      sim_statuses: normalized.simStatuses,
      technicians: normalized.technicians,
      sla_statuses: normalized.slaStatuses,
      device_issue_types: normalized.deviceIssueTypes,
      device_responsibilities: normalized.deviceResponsibilities,
      device_issue_statuses: normalized.deviceIssueStatuses,
      service_location_types: normalized.serviceLocationTypes,
      service_segments: normalized.serviceSegments,
      service_issue_types: normalized.serviceIssueTypes,
      service_priorities: normalized.servicePriorities,
      service_ticket_statuses: normalized.serviceTicketStatuses,
      service_delivery_options: normalized.serviceDeliveryOptions,
      service_payment_methods: normalized.servicePaymentMethods,
      issue_tracker_statuses: normalized.issueTrackerStatuses,
      issue_premises_names: normalized.issuePremisesNames,
      issue_priority_levels: normalized.issuePriorityLevels,
      bill_payment_statuses: normalized.billPaymentStatuses,
      bill_payment_methods: normalized.billPaymentMethods,
      options: normalized,
      updated_at: new Date().toISOString(),
    };

    // First attempt full upsert with all dedicated columns
    const { error } = await supabase.from('system_options').upsert([fullRow], { onConflict: 'id' });
    if (error) {
      console.warn('Supabase saveSystemOptions full-column attempt warning:', error.message);
      // Fallback: upsert with legacy columns + full JSONB options so saving still works before SQL migration runs
      const legacyRow = {
        id: 'default',
        device_statuses: normalized.deviceStatuses,
        sim_operators: normalized.simOperators,
        access_types: normalized.accessTypes,
        location_types: normalized.locationTypes,
        issue_types: normalized.issueTypes,
        ticket_priorities: normalized.ticketPriorities,
        ticket_statuses: normalized.ticketStatuses,
        vendors: normalized.vendors,
        po_statuses: normalized.poStatuses,
        sim_statuses: normalized.simStatuses,
        technicians: normalized.technicians,
        options: normalized,
        updated_at: new Date().toISOString(),
      };
      const { error: legacyErr } = await supabase.from('system_options').upsert([legacyRow], { onConflict: 'id' });
      if (legacyErr) {
        const jsonOnlyRow = {
          id: 'default',
          options: normalized,
          updated_at: new Date().toISOString(),
        };
        const { error: fallbackErr } = await supabase.from('system_options').upsert([jsonOnlyRow], { onConflict: 'id' });
        if (fallbackErr) {
          console.warn('Supabase saveSystemOptions fallback error:', fallbackErr.message);
          return false;
        }
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

    let parsedHiddenModules: string[] | undefined = undefined;
    if (data.hidden_modules) {
      if (Array.isArray(data.hidden_modules)) {
        parsedHiddenModules = data.hidden_modules;
      } else if (typeof data.hidden_modules === 'string') {
        try {
          parsedHiddenModules = JSON.parse(data.hidden_modules);
        } catch (e) {
          parsedHiddenModules = data.hidden_modules.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
    }

    return {
      appName: data.app_name || defaultAppSettings.appName,
      appLogo: data.app_logo || '',
      tagline: data.tagline || defaultAppSettings.tagline,
      hiddenModules: parsedHiddenModules,
    };
  } catch (err) {
    console.warn('Supabase fetchAppSettings catch error:', err);
    return null;
  }
}

export async function saveSupabaseAppSettings(settings: AppSettings): Promise<boolean> {
  try {
    const fallbackRow = {
      id: 'global',
      app_name: settings.appName || defaultAppSettings.appName,
      app_logo: settings.appLogo || '',
      tagline: settings.tagline || defaultAppSettings.tagline,
      updated_at: new Date().toISOString(),
    };

    if (settings.hiddenModules !== undefined) {
      const fullRow = {
        ...fallbackRow,
        hidden_modules: settings.hiddenModules,
      };
      const { error } = await supabase.from('app_settings').upsert([fullRow]);
      if (!error) return true;
    }

    const { error: fallbackErr } = await supabase.from('app_settings').upsert([fallbackRow]);
    if (fallbackErr) {
      console.warn('Supabase saveAppSettings fallback error:', fallbackErr.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveAppSettings catch error:', err);
    return false;
  }
}

// Dedicated helper to persist hidden modules globally in Supabase (with multi-table fallback)
export async function saveSupabaseHiddenModules(hiddenModules: string[]): Promise<boolean> {
  try {
    // 1. First save to app_settings
    const appSettingsRes = await supabase.from('app_settings').upsert([
      {
        id: 'global',
        hidden_modules: hiddenModules,
        updated_at: new Date().toISOString(),
      },
    ]);

    // 2. Also save to system_options table under id 'module_controller' or inside 'options' column
    // as an extra resilient backup so any user/device gets it regardless of schema migration
    try {
      await supabase.from('system_options').upsert([
        {
          id: 'module_controller',
          options: { hiddenModules },
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'id' });
    } catch (e) {
      // ignore secondary table failure if table is restricted
    }

    if (appSettingsRes.error) {
      console.warn('Supabase saveHiddenModules error:', appSettingsRes.error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveHiddenModules catch error:', err);
    return false;
  }
}

export async function fetchSupabaseHiddenModules(): Promise<string[] | null> {
  try {
    // Try app_settings first
    const { data, error } = await supabase
      .from('app_settings')
      .select('hidden_modules')
      .eq('id', 'global')
      .maybeSingle();

    if (!error && data && data.hidden_modules) {
      if (Array.isArray(data.hidden_modules)) return data.hidden_modules;
      if (typeof data.hidden_modules === 'string') {
        try {
          return JSON.parse(data.hidden_modules);
        } catch (e) {
          return data.hidden_modules.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
    }

    // Try secondary system_options backup
    const { data: optData } = await supabase
      .from('system_options')
      .select('options')
      .eq('id', 'module_controller')
      .maybeSingle();

    if (optData && optData.options && Array.isArray(optData.options.hiddenModules)) {
      return optData.options.hiddenModules;
    }

    return null;
  } catch (e) {
    console.warn('fetchSupabaseHiddenModules error:', e);
    return null;
  }
}

// -------------------------------------------------------------
// ISSUE TRACKER & ISSUE REPORTS (Extended 34-Field Mapping)
// -------------------------------------------------------------
function serializeIssueDetails(issue: IssueTrackerItem): string {
  const payload = {
    sl: issue.sl,
    issueLogDate: issue.issueLogDate || issue.date,
    odooId: issue.odooId || issue.odooTicketId,
    status: issue.status || 'Open',
    clientName: issue.clientName || issue.branchName,
    premesisName: issue.premesisName || issue.location,
    priority: issue.priority || 'Medium',
    deviceReplace: issue.deviceReplace || 'No',
    oldDevice: issue.oldDevice || issue.oldDeviceId || '-',
    newDevice: issue.newDevice || issue.replaceDeviceId || '-',
    clientReportingTime: issue.clientReportingTime || '',
    responseTime: issue.responseTime || '',
    accessories: issue.accessories || '',
    product: issue.product || '',
    district: issue.district || '',
    address: issue.address || '',
    contactPerson: issue.contactPerson || '',
    number: issue.number || '',
    comments: issue.comments || issue.details || '',
    deliveryOption: issue.deliveryOption || '',
    serviceType: issue.serviceType || issue.issueType || '',
    kam: issue.kam || '',
    segment: issue.segment || issue.category || '',
    invoiceHandover: issue.invoiceHandover || '',
    collectionAmount: issue.collectionAmount !== undefined ? issue.collectionAmount : '0',
    paymentMethod: issue.paymentMethod || '',
    installationStatus: issue.installationStatus || '',
    handedOverTo: issue.handedOverTo || '',
    assignPerson: issue.assignPerson || '',
    handoverCollected: issue.handoverCollected || 'No',
    installationDate: issue.installationDate || issue.resolutionDate || '',
    unitQty: issue.unitQty !== undefined ? issue.unitQty : 1,
    vendorBillAmount: issue.vendorBillAmount !== undefined ? issue.vendorBillAmount : '0',
    remarks: issue.remarks || '',
    details: issue.details || '',
  };
  return JSON.stringify(payload);
}

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

    return data.map((d: any, index: number) => {
      let ext: any = {};
      if (d.details && typeof d.details === 'string') {
        try {
          if (d.details.trim().startsWith('{')) {
            ext = JSON.parse(d.details);
          }
        } catch (e) {}
      }

      const clientName = ext.clientName || d.branch_name || '';
      const premesisName = ext.premesisName || d.location || 'ROC';
      const odooId = ext.odooId || d.odoo_ticket_id || '';
      const status = ext.status || d.status || 'Open';
      const priority = ext.priority || d.priority || 'Medium';
      const deviceReplace = ext.deviceReplace || (d.device_replace === 'YES' || d.device_replace === true ? 'Yes' : 'No');
      const oldDevice = ext.oldDevice || d.old_device_id || '-';
      const newDevice = ext.newDevice || d.replace_device_id || '-';
      const comments = ext.comments || (ext.details ? ext.details : d.details || '');
      const remarks = ext.remarks || '';

      return {
        id: d.id || `ISSUE-${Date.now()}-${index}`,
        sl: ext.sl !== undefined ? ext.sl : index + 1,
        issueLogDate: ext.issueLogDate || d.date || (d.created_at ? d.created_at.split('T')[0] : ''),
        odooId,
        status,
        clientName,
        premesisName,
        priority,
        deviceReplace,
        oldDevice,
        newDevice,
        clientReportingTime: ext.clientReportingTime || (d.client_reporting_date ? `${d.client_reporting_date}T${d.client_reporting_time || '00:00'}` : ''),
        responseTime: ext.responseTime || (d.client_response_date ? `${d.client_response_date}T${d.client_response_time || '00:00'}` : ''),
        accessories: ext.accessories || '',
        product: ext.product || '',
        district: ext.district || '',
        address: ext.address || '',
        contactPerson: ext.contactPerson || '',
        number: ext.number || '',
        comments,
        deliveryOption: ext.deliveryOption || '',
        serviceType: ext.serviceType || d.issue_type || '',
        kam: ext.kam || '',
        segment: ext.segment || d.category || '',
        invoiceHandover: ext.invoiceHandover || '',
        collectionAmount: ext.collectionAmount !== undefined ? ext.collectionAmount : '0',
        paymentMethod: ext.paymentMethod || '',
        installationStatus: ext.installationStatus || '',
        handedOverTo: ext.handedOverTo || '',
        assignPerson: ext.assignPerson || d.assign_person || '',
        handoverCollected: ext.handoverCollected || 'No',
        installationDate: ext.installationDate || d.resolution_date || '',
        unitQty: ext.unitQty !== undefined ? ext.unitQty : 1,
        vendorBillAmount: ext.vendorBillAmount !== undefined ? ext.vendorBillAmount : '0',
        remarks,

        // Legacy compatibility properties
        branchName: clientName,
        issueType: ext.serviceType || d.issue_type || '',
        category: ext.segment || d.category || '',
        odooTicketId: odooId,
        replaceDeviceId: newDevice,
        oldDeviceId: oldDevice,
        location: premesisName,
        date: ext.issueLogDate || d.date || '',
        clientReportingDate: d.client_reporting_date || '',
        clientResponseDate: d.client_response_date || '',
        clientResponseTime: d.client_response_time || '',
        resolutionDate: d.resolution_date || '',
        resolutionTime: d.resolution_time || '',
        details: comments,
        createdAt: d.created_at || new Date().toISOString(),
        updatedAt: d.updated_at || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn('Supabase fetchIssues catch error:', err);
    return null;
  }
}

export async function insertSupabaseIssue(issue: IssueTrackerItem): Promise<boolean> {
  try {
    const serialized = serializeIssueDetails(issue);
    const row = {
      id: issue.id,
      branch_name: issue.clientName || issue.branchName || '',
      issue_type: issue.serviceType || issue.issueType || '',
      category: issue.segment || issue.category || '',
      odoo_ticket_id: issue.odooId || issue.odooTicketId || '',
      priority: issue.priority || 'Medium',
      device_replace: issue.deviceReplace || 'No',
      replace_device_id: issue.newDevice || issue.replaceDeviceId || '',
      old_device_id: issue.oldDevice || issue.oldDeviceId || '',
      location: issue.premesisName || issue.location || '',
      assign_person: issue.assignPerson || '',
      status: issue.status || 'Open',
      date: issue.issueLogDate || issue.date || '',
      client_reporting_date: issue.clientReportingDate || (issue.clientReportingTime ? issue.clientReportingTime.split('T')[0] : ''),
      client_reporting_time: issue.clientReportingTime ? (issue.clientReportingTime.split('T')[1] || '') : '',
      client_response_date: issue.clientResponseDate || (issue.responseTime ? issue.responseTime.split('T')[0] : ''),
      client_response_time: issue.responseTime ? (issue.responseTime.split('T')[1] || '') : '',
      resolution_date: issue.installationDate || issue.resolutionDate || '',
      resolution_time: issue.resolutionTime || '',
      details: serialized,
      created_at: issue.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('issues').upsert([row], { onConflict: 'id' });
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
    const rows = issues.map((issue) => {
      const serialized = serializeIssueDetails(issue);
      return {
        id: issue.id || `ISSUE-${Math.floor(10000 + Math.random() * 90000)}`,
        branch_name: issue.clientName || issue.branchName || '',
        issue_type: issue.serviceType || issue.issueType || '',
        category: issue.segment || issue.category || '',
        odoo_ticket_id: issue.odooId || issue.odooTicketId || '',
        priority: issue.priority || 'Medium',
        device_replace: issue.deviceReplace || 'No',
        replace_device_id: issue.newDevice || issue.replaceDeviceId || '',
        old_device_id: issue.oldDevice || issue.oldDeviceId || '',
        location: issue.premesisName || issue.location || '',
        assign_person: issue.assignPerson || '',
        status: issue.status || 'Open',
        date: issue.issueLogDate || issue.date || '',
        client_reporting_date: issue.clientReportingDate || (issue.clientReportingTime ? issue.clientReportingTime.split('T')[0] : ''),
        client_reporting_time: issue.clientReportingTime ? (issue.clientReportingTime.split('T')[1] || '') : '',
        client_response_date: issue.clientResponseDate || (issue.responseTime ? issue.responseTime.split('T')[0] : ''),
        client_response_time: issue.responseTime ? (issue.responseTime.split('T')[1] || '') : '',
        resolution_date: issue.installationDate || issue.resolutionDate || '',
        resolution_time: issue.resolutionTime || '',
        details: serialized,
        created_at: issue.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase.from('issues').upsert(rows, { onConflict: 'id' });
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

// -------------------------------------------------------------
// DEVICE SUPPORT TICKETS (Device Issue Tracker & Report)
// -------------------------------------------------------------
const DEVICE_TICKET_STATUS_STORE_ID = 'device_support_ticket_statuses';
let deviceSupportTicketsHasStatusCol: boolean | null = null;

export function normalizeDeviceSupportStatus(
  raw?: string
): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return 'Pending';
  const s = trimmed.toLowerCase();
  if (s === 'solved' || s === 'done' || s === 'resolved' || s === 'closed') {
    return 'Solved';
  }
  if (s === 'on going' || s === 'ongoing' || s === 'in progress' || s === 'in-progress') {
    return 'On Going';
  }
  if (s === 'pending') {
    return 'Pending';
  }
  return trimmed;
}

async function fetchDeviceTicketStatusMap(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('system_options')
      .select('options')
      .eq('id', DEVICE_TICKET_STATUS_STORE_ID)
      .maybeSingle();

    if (!error && data && data.options && typeof data.options === 'object') {
      return data.options as Record<string, string>;
    }
  } catch (e) {
    // ignore fallback fetch error
  }
  return {};
}

async function saveDeviceTicketStatusesToStore(entries: Array<{ id: string; status: string }>) {
  if (entries.length === 0) return;
  try {
    const currentMap = await fetchDeviceTicketStatusMap();
    const nextMap: Record<string, string> = { ...currentMap };
    entries.forEach((entry) => {
      if (entry.id) {
        nextMap[entry.id] = normalizeDeviceSupportStatus(entry.status);
      }
    });
    await supabase.from('system_options').upsert(
      [
        {
          id: DEVICE_TICKET_STATUS_STORE_ID,
          options: nextMap,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'id' }
    );
  } catch (e) {
    console.warn('Supabase saveDeviceTicketStatusesToStore warning:', e);
  }
}

async function removeDeviceTicketStatusesFromStore(ids: string[]) {
  if (ids.length === 0) return;
  try {
    const currentMap = await fetchDeviceTicketStatusMap();
    let changed = false;
    const nextMap: Record<string, string> = { ...currentMap };
    ids.forEach((id) => {
      if (id in nextMap) {
        delete nextMap[id];
        changed = true;
      }
    });
    if (!changed) return;
    await supabase.from('system_options').upsert(
      [
        {
          id: DEVICE_TICKET_STATUS_STORE_ID,
          options: nextMap,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'id' }
    );
  } catch (e) {
    // ignore cleanup errors
  }
}

function mapRowToDeviceSupportTicket(
  d: any,
  index: number = 0,
  statusMap: Record<string, string> = {}
): DeviceSupportTicket {
  const id = String(d.id || `DST-${Date.now()}-${index}`);
  const rawStatus = d.status || statusMap[id] || 'Pending';
  return {
    id,
    slNo: d.sl_no !== undefined ? Number(d.sl_no) : (d.slNo !== undefined ? Number(d.slNo) : index + 1),
    deviceId: d.device_id || d.deviceId || '',
    contactDate: d.contact_date || d.contactDate || '',
    lastCommunication: d.last_communication || d.lastCommunication || '',
    deviceLocation: d.device_location || d.deviceLocation || '',
    issueType: d.issue_type || d.issueType || '',
    responsibility: d.responsibility || 'ITL',
    status: normalizeDeviceSupportStatus(rawStatus),
    probableSolvingDate: d.probable_solving_date || d.probableSolvingDate || '',
    ticketStatus: d.ticket_status || d.ticketStatus || 'No',
    odooId: d.odoo_id || d.odooId || '',
    remarks: d.remarks || '',
    createdAt: d.created_at || d.createdAt || new Date().toISOString(),
    updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
  };
}

function mapDeviceSupportTicketToRow(ticket: DeviceSupportTicket, includeStatus: boolean) {
  const base = {
    id: ticket.id,
    sl_no: ticket.slNo !== undefined ? Number(ticket.slNo) : 1,
    device_id: ticket.deviceId || '',
    contact_date: ticket.contactDate || '',
    last_communication: ticket.lastCommunication || '',
    device_location: ticket.deviceLocation || '',
    issue_type: ticket.issueType || '',
    responsibility: ticket.responsibility || 'ITL',
    probable_solving_date: ticket.probableSolvingDate || '',
    ticket_status: ticket.ticketStatus || 'No',
    odoo_id: ticket.odooId || '',
    remarks: ticket.remarks || '',
    created_at: ticket.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (includeStatus) {
    return {
      ...base,
      status: normalizeDeviceSupportStatus(ticket.status),
    };
  }
  return base;
}

export async function fetchSupabaseDeviceSupportTickets(): Promise<DeviceSupportTicket[] | null> {
  try {
    const [ticketsRes, statusMap] = await Promise.all([
      supabase
        .from('device_support_tickets')
        .select('*')
        .order('sl_no', { ascending: false }),
      fetchDeviceTicketStatusMap(),
    ]);

    const { data, error } = ticketsRes;

    if (error) {
      console.warn('Supabase fetchDeviceSupportTickets warning:', error.message);
      // Fallback query without sorting in case index/schema differs
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('device_support_tickets')
        .select('*');
      if (fallbackError) {
        return null;
      }
      if (!fallbackData) return [];
      if (fallbackData.length > 0 && 'status' in fallbackData[0]) {
        deviceSupportTicketsHasStatusCol = true;
      }
      return fallbackData.map((d: any, idx: number) =>
        mapRowToDeviceSupportTicket(d, idx, statusMap)
      );
    }

    if (!data) return [];
    if (data.length > 0) {
      deviceSupportTicketsHasStatusCol = 'status' in data[0];
    }
    return data.map((d: any, idx: number) => mapRowToDeviceSupportTicket(d, idx, statusMap));
  } catch (err) {
    console.warn('Supabase fetchDeviceSupportTickets catch error:', err);
    return null;
  }
}

export async function insertSupabaseDeviceSupportTicket(ticket: DeviceSupportTicket): Promise<boolean> {
  try {
    const normalizedStatus = normalizeDeviceSupportStatus(ticket.status);

    if (deviceSupportTicketsHasStatusCol !== false) {
      const rowWithStatus = mapDeviceSupportTicketToRow(ticket, true);
      const { error } = await supabase
        .from('device_support_tickets')
        .upsert([rowWithStatus], { onConflict: 'id' });

      if (!error) {
        deviceSupportTicketsHasStatusCol = true;
        await saveDeviceTicketStatusesToStore([{ id: ticket.id, status: normalizedStatus }]);
        return true;
      }

      if (error.message && error.message.toLowerCase().includes('status')) {
        deviceSupportTicketsHasStatusCol = false;
      } else {
        console.warn('Supabase insertDeviceSupportTicket error:', error.message);
        return false;
      }
    }

    const rowWithoutStatus = mapDeviceSupportTicketToRow(ticket, false);
    const [{ error: fallbackErr }] = await Promise.all([
      supabase
        .from('device_support_tickets')
        .upsert([rowWithoutStatus], { onConflict: 'id' }),
      saveDeviceTicketStatusesToStore([{ id: ticket.id, status: normalizedStatus }]),
    ]);

    if (fallbackErr) {
      console.warn('Supabase insertDeviceSupportTicket error:', fallbackErr.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase insertDeviceSupportTicket catch error:', err);
    return false;
  }
}

export async function bulkInsertSupabaseDeviceSupportTickets(tickets: DeviceSupportTicket[]): Promise<boolean> {
  try {
    const statusEntries = tickets.map((t) => ({
      id: t.id,
      status: normalizeDeviceSupportStatus(t.status),
    }));

    if (deviceSupportTicketsHasStatusCol !== false) {
      const rowsWithStatus = tickets.map((t) => mapDeviceSupportTicketToRow(t, true));
      const { error } = await supabase
        .from('device_support_tickets')
        .upsert(rowsWithStatus, { onConflict: 'id' });

      if (!error) {
        deviceSupportTicketsHasStatusCol = true;
        await saveDeviceTicketStatusesToStore(statusEntries);
        return true;
      }

      if (error.message && error.message.toLowerCase().includes('status')) {
        deviceSupportTicketsHasStatusCol = false;
      } else {
        console.warn('Supabase bulkInsertDeviceSupportTickets error:', error.message);
        return false;
      }
    }

    const rowsWithoutStatus = tickets.map((t) => mapDeviceSupportTicketToRow(t, false));
    const [{ error: fallbackErr }] = await Promise.all([
      supabase
        .from('device_support_tickets')
        .upsert(rowsWithoutStatus, { onConflict: 'id' }),
      saveDeviceTicketStatusesToStore(statusEntries),
    ]);

    if (fallbackErr) {
      console.warn('Supabase bulkInsertDeviceSupportTickets error:', fallbackErr.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkInsertDeviceSupportTickets catch error:', err);
    return false;
  }
}

export async function deleteSupabaseDeviceSupportTicket(id: string): Promise<boolean> {
  try {
    const [{ error }] = await Promise.all([
      supabase.from('device_support_tickets').delete().eq('id', id),
      removeDeviceTicketStatusesFromStore([id]),
    ]);

    if (error) {
      console.warn('Supabase deleteDeviceSupportTicket error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteDeviceSupportTicket catch error:', err);
    return false;
  }
}

export async function bulkDeleteSupabaseDeviceSupportTickets(ids: string[]): Promise<boolean> {
  try {
    const [{ error }] = await Promise.all([
      supabase.from('device_support_tickets').delete().in('id', ids),
      removeDeviceTicketStatusesFromStore(ids),
    ]);

    if (error) {
      console.warn('Supabase bulkDeleteDeviceSupportTickets error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkDeleteDeviceSupportTickets catch error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// BILLS (Bill Tracker & Bill Report)
// -------------------------------------------------------------
function mapRowToBillItem(d: any, index: number = 0): BillItem {
  return {
    id: String(d.id || d.bill_number || d.billNumber || `BILL-${Date.now()}-${index}`),
    billNumber: d.bill_number || d.billNumber || String(d.id || ''),
    invoiceNumber: d.invoice_number || d.invoiceNumber || '',
    vendor: d.vendor || '',
    client: d.client || 'Black Bank PLC',
    clientLocation: d.client_location || d.clientLocation || '',
    description: d.description || '',
    billType: d.bill_type || d.billType || 'Installation Support',
    amount: Number(d.amount) || 0,
    handoverDate: d.handover_date || d.handoverDate || '',
    submissionDate: d.submission_date || d.submissionDate || '',
    receivedDate: d.received_date || d.receivedDate || '',
    paymentDate: d.payment_date || d.paymentDate || '',
    status: (d.status || 'Pending') as 'Pending' | 'Submitted' | 'Partial' | 'Paid',
    approvedBy: d.approved_by || d.approvedBy || '',
    paymentMethod: d.payment_method || d.paymentMethod || 'Bank Transfer',
    remarks: d.remarks || '',
    createdAt: d.created_at || d.createdAt || new Date().toISOString(),
    updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
  };
}

function mapBillItemToRow(bill: BillItem) {
  return {
    id: bill.id || bill.billNumber,
    bill_number: bill.billNumber,
    invoice_number: bill.invoiceNumber || '',
    vendor: bill.vendor || '',
    client: bill.client || 'Black Bank PLC',
    client_location: bill.clientLocation || '',
    description: bill.description || '',
    bill_type: bill.billType || 'Installation Support',
    amount: Number(bill.amount) || 0,
    handover_date: bill.handoverDate || '',
    submission_date: bill.submissionDate || '',
    received_date: bill.receivedDate || '',
    payment_date: bill.paymentDate || '',
    status: bill.status || 'Pending',
    approved_by: bill.approvedBy || '',
    payment_method: bill.paymentMethod || 'Bank Transfer',
    remarks: bill.remarks || '',
    created_at: bill.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function fetchSupabaseBills(): Promise<BillItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchBills warning:', error.message);
      // Fallback query without sorting
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('bills')
        .select('*');
      if (fallbackError) {
        return null;
      }
      if (!fallbackData) return [];
      return fallbackData.map((d: any, idx: number) => mapRowToBillItem(d, idx));
    }

    if (!data) return [];
    return data.map((d: any, idx: number) => mapRowToBillItem(d, idx));
  } catch (err) {
    console.warn('Supabase fetchBills catch error:', err);
    return null;
  }
}

export async function insertSupabaseBill(bill: BillItem): Promise<boolean> {
  try {
    const row = mapBillItemToRow(bill);
    const { error } = await supabase
      .from('bills')
      .upsert([row], { onConflict: 'id' });

    if (error) {
      console.warn('Supabase insertBill error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase insertBill catch error:', err);
    return false;
  }
}

export async function bulkInsertSupabaseBills(bills: BillItem[]): Promise<boolean> {
  try {
    const rows = bills.map((b) => mapBillItemToRow(b));
    const { error } = await supabase
      .from('bills')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase bulkInsertBills error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkInsertBills catch error:', err);
    return false;
  }
}

export async function deleteSupabaseBill(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase deleteBill error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteBill catch error:', err);
    return false;
  }
}

export async function bulkDeleteSupabaseBills(ids: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bills')
      .delete()
      .in('id', ids);

    if (error) {
      console.warn('Supabase bulkDeleteBills error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkDeleteBills catch error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// SERVICE TICKETS (Hardware Maintenance & Support Tickets)
// -------------------------------------------------------------
export async function fetchSupabaseServiceTickets(): Promise<ServiceTicketItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('service_tickets')
      .select('*')
      .limit(10000)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchServiceTickets error:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((t: any) => ({
      id: t.id || '',
      issueNumber: t.issue_number || t.id,
      odooId: t.odoo_id || '',
      emailFrom: t.email_from || '',
      emailSubject: t.email_subject || '',
      client: t.client || 'Black Bank PLC',
      contactPerson: t.contact_person || '',
      contactNumber: t.contact_number || '',
      district: t.district || 'Dhaka',
      address: t.address || '',
      deviceLocation: t.device_location || '',
      locationType: t.location_type || 'Main Branch',
      deviceId: t.device_id || '',
      product: t.product || '',
      productPrice: t.product_price || '',
      segment: t.segment || 'Corporate',
      kam: t.kam || '',
      requestDate: t.request_date || '',
      requestTime: t.request_time || '',
      plannedDate: t.planned_date || '',
      serviceDate: t.service_date || '',
      slaThreshold: Number(t.sla_threshold) || 3,
      resolutionDays: t.resolution_days || 0,
      slaStatus: t.sla_status || 'Pending',
      issues: t.issues || '',
      priority: t.priority || 'Medium',
      status: t.status || 'Open',
      replace: t.replace || 'No',
      replaceDeviceId: t.replace_device_id || 'N/A',
      assignPerson: t.assign_person || '',
      accessories: t.accessories || '',
      deliveryOption: t.delivery_option || 'Onsite',
      challanBy: t.challan_by || '',
      handedOverTo: t.handed_over_to || '',
      unitQty: Number(t.unit_qty) || 1,
      invoiceHandover: t.invoice_handover || 'No',
      paymentMethod: t.payment_method || 'Cash',
      vendorBill: t.vendor_bill || '',
      remarks: t.remarks || '',
      visitEmail: t.visit_email || '',
      comments: t.comments || '',
      createdAt: t.created_at || new Date().toISOString(),
      updatedAt: t.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Supabase fetchServiceTickets catch error:', err);
    return null;
  }
}

export async function insertSupabaseServiceTicket(ticket: ServiceTicketItem): Promise<boolean> {
  try {
    const row = {
      id: ticket.id,
      issue_number: ticket.issueNumber,
      odoo_id: ticket.odooId || '',
      email_from: ticket.emailFrom || '',
      email_subject: ticket.emailSubject || '',
      client: ticket.client || 'Black Bank PLC',
      contact_person: ticket.contactPerson || '',
      contact_number: ticket.contactNumber || '',
      district: ticket.district || 'Dhaka',
      address: ticket.address || '',
      device_location: ticket.deviceLocation || '',
      location_type: ticket.locationType || 'Main Branch',
      device_id: ticket.deviceId || '',
      product: ticket.product || '',
      product_price: ticket.productPrice || '',
      segment: ticket.segment || 'Corporate',
      kam: ticket.kam || '',
      request_date: ticket.requestDate || '',
      request_time: ticket.requestTime || '',
      planned_date: ticket.plannedDate || '',
      service_date: ticket.serviceDate || '',
      sla_threshold: ticket.slaThreshold || 3,
      resolution_days: String(ticket.resolutionDays || 0),
      sla_status: ticket.slaStatus || 'Pending',
      issues: ticket.issues || '',
      priority: ticket.priority || 'Medium',
      status: ticket.status || 'Open',
      replace: ticket.replace || 'No',
      replace_device_id: ticket.replaceDeviceId || 'N/A',
      assign_person: ticket.assignPerson || '',
      accessories: ticket.accessories || '',
      delivery_option: ticket.deliveryOption || 'Onsite',
      challan_by: ticket.challanBy || '',
      handed_over_to: ticket.handedOverTo || '',
      unit_qty: ticket.unitQty || 1,
      invoice_handover: ticket.invoiceHandover || 'No',
      payment_method: ticket.paymentMethod || 'Cash',
      vendor_bill: ticket.vendorBill || '',
      remarks: ticket.remarks || '',
      visit_email: ticket.visitEmail || '',
      comments: ticket.comments || '',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('service_tickets').upsert([row], { onConflict: 'id' });
    if (error) {
      console.warn('Supabase insertServiceTicket error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase insertServiceTicket catch error:', err);
    return false;
  }
}

export async function deleteSupabaseServiceTicket(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('service_tickets').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteServiceTicket error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteServiceTicket catch error:', err);
    return false;
  }
}

export async function bulkDeleteSupabaseServiceTickets(ids: string[]): Promise<boolean> {
  try {
    const { error } = await supabase.from('service_tickets').delete().in('id', ids);
    if (error) {
      console.warn('Supabase bulkDeleteServiceTickets error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulkDeleteServiceTickets catch error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// LIVE REALTIME SUBSCRIPTION FOR MULTI-USER COLLABORATION
// -------------------------------------------------------------
export function subscribeToSupabaseLiveSync(
  onTableChange: (tableName: string, eventType: string) => void
): () => void {
  try {
    const channelName = `realtime-multiuser-sync-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          if (payload && payload.table) {
            onTableChange(payload.table, payload.eventType || 'UPDATE');
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn('Error removing Supabase channel:', err);
      }
    };
  } catch (e) {
    console.warn('Failed to subscribe to Supabase realtime channel:', e);
    return () => {};
  }
}

