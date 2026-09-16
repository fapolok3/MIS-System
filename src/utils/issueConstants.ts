import { IssueTrackerItem } from '../types';

export const STATUS_OPTIONS = ['Open', 'Pending', 'OnBoard', 'Working', 'Done'] as const;
export type IssueStatusType = (typeof STATUS_OPTIONS)[number];

export const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'] as const;
export type IssuePriorityType = (typeof PRIORITY_OPTIONS)[number];

export const PREMESIS_OPTIONS = [
  'Main Branch',
  'Branch',
  'Sub Branch',
  'SME',
  'ROC',
  'DPDC',
  'ATMSC',
  'DC',
  'DR',
  'Anik Tower',
  'Sepal Tower',
  'Pinacle Tower',
  'Nina Kabba',
  'Parking Tejgaon',
  'Parking Rajuk',
] as const;

export const ISSUE_FIELD_KEYS = [
  'sl',
  'issueLogDate',
  'odooId',
  'status',
  'clientName',
  'premesisName',
  'priority',
  'deviceReplace',
  'oldDevice',
  'newDevice',
  'clientReportingTime',
  'responseTime',
  'accessories',
  'product',
  'district',
  'address',
  'contactPerson',
  'number',
  'comments',
  'deliveryOption',
  'serviceType',
  'kam',
  'segment',
  'invoiceHandover',
  'collectionAmount',
  'paymentMethod',
  'installationStatus',
  'handedOverTo',
  'assignPerson',
  'handoverCollected',
  'installationDate',
  'unitQty',
  'vendorBillAmount',
  'remarks',
] as const;

export const ISSUE_FIELD_LABELS: Record<string, string> = {
  sl: 'SL Number',
  issueLogDate: 'Issue Log Date',
  odooId: 'Odoo Id',
  status: 'Status',
  clientName: 'Client Name',
  premesisName: 'Premesis Name',
  priority: 'Priority Level',
  deviceReplace: 'Device Replace Required',
  oldDevice: 'Old Device ID / Serial',
  newDevice: 'New Device ID / Serial',
  clientReportingTime: 'Client Reporting Time & Date',
  responseTime: 'Response Time & Date',
  accessories: 'Accessories Provided',
  product: 'Product Name',
  district: 'District',
  address: 'Detailed Site Address',
  contactPerson: 'Contact Person Name',
  number: 'Contact Phone Number',
  comments: 'Issue Description & Comments',
  deliveryOption: 'Delivery Option',
  serviceType: 'Service Type',
  kam: 'Key Account Manager (KAM)',
  segment: 'Market Segment',
  invoiceHandover: 'Invoice Handover Status',
  collectionAmount: 'Collection Amount (BDT)',
  paymentMethod: 'Payment Method',
  installationStatus: 'Installation Status',
  handedOverTo: 'Handed Over to',
  assignPerson: 'Assigned Person',
  handoverCollected: 'Handover Collected',
  installationDate: 'Installation Date',
  unitQty: 'Unit Quantity',
  vendorBillAmount: 'Vendor Bill Amount (BDT)',
  remarks: 'Final Operational Remarks',
};

// Map status to HTML row color classes
export function getRowStatusClass(status: string | undefined): string {
  const s = (status || 'Open').trim().toLowerCase();
  if (s.includes('open')) return 'row-status-open';
  if (s.includes('pending')) return 'row-status-pending';
  if (s.includes('onboard') || s.includes('on board') || s.includes('assigned')) return 'row-status-onboard';
  if (s.includes('working') || s.includes('progress')) return 'row-status-working';
  if (s.includes('done') || s.includes('resolved') || s.includes('closed') || s.includes('complete')) return 'row-status-done';
  return 'row-status-open';
}

// Map status to badge styles
export function getStatusBadgeStyle(status: string | undefined): { bg: string; text: string; border: string } {
  const s = (status || 'Open').trim().toLowerCase();
  if (s.includes('open')) return { bg: 'bg-red-100 dark:bg-red-950/60', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-800' };
  if (s.includes('pending')) return { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' };
  if (s.includes('onboard') || s.includes('on board')) return { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-800' };
  if (s.includes('working') || s.includes('progress')) return { bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-800' };
  if (s.includes('done') || s.includes('resolved') || s.includes('closed')) return { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' };
  return { bg: 'bg-gray-100 dark:bg-slate-800', text: 'text-gray-800 dark:text-gray-200', border: 'border-gray-300 dark:border-gray-700' };
}

// Map priority to badge styles
export function getPriorityBadgeStyle(priority: string | undefined): { bg: string; text: string; border: string } {
  const p = (priority || 'Medium').trim().toLowerCase();
  if (p.includes('high') || p.includes('critical')) {
    return { bg: 'bg-red-100 dark:bg-red-950/60', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-800' };
  }
  if (p.includes('med')) {
    return { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' };
  }
  return { bg: 'bg-sky-100 dark:bg-sky-950/60', text: 'text-sky-800 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-800' };
}

// Clean normalizer for IssueTrackerItem
export function normalizeIssue(raw: Partial<IssueTrackerItem>, index: number = 0): IssueTrackerItem {
  const id = raw.id || `ISSUE-${Date.now()}-${index}`;
  const sl = raw.sl !== undefined && raw.sl !== null ? Number(raw.sl) : index + 1;
  const issueLogDate = raw.issueLogDate || raw.date || new Date().toISOString().split('T')[0];
  const odooId = raw.odooId || raw.odooTicketId || '';
  
  // Normalize Status
  let status = raw.status || 'Open';
  const sLower = status.toLowerCase();
  if (sLower === 'open') status = 'Open';
  else if (sLower.includes('pend')) status = 'Pending';
  else if (sLower.includes('onboard') || sLower.includes('on board')) status = 'OnBoard';
  else if (sLower.includes('work') || sLower.includes('progress')) status = 'Working';
  else if (sLower.includes('done') || sLower.includes('resolve') || sLower.includes('close')) status = 'Done';

  // Normalize Priority
  let priority = raw.priority || 'Medium';
  const pLower = priority.toLowerCase();
  if (pLower.includes('high') || pLower.includes('crit')) priority = 'High';
  else if (pLower.includes('low')) priority = 'Low';
  else priority = 'Medium';

  const clientName = raw.clientName || raw.branchName || 'Brac Bank';
  const premesisName = raw.premesisName || raw.location || 'ROC';

  const rawRep = String(raw.deviceReplace || '');
  const deviceReplace = (rawRep === 'Yes' || rawRep === 'YES' || rawRep.toLowerCase() === 'yes') ? 'Yes' : 'No';

  const oldDevice = deviceReplace === 'Yes' ? (raw.oldDevice || raw.oldDeviceId || '-') : '-';
  const newDevice = deviceReplace === 'Yes' ? (raw.newDevice || raw.replaceDeviceId || '-') : '-';

  return {
    id,
    sl,
    issueLogDate,
    odooId,
    status,
    clientName,
    premesisName,
    priority,
    deviceReplace,
    oldDevice,
    newDevice,
    clientReportingTime: raw.clientReportingTime || (raw.clientReportingDate ? `${raw.clientReportingDate}T${raw.clientReportingTime || '00:00'}` : ''),
    responseTime: raw.responseTime || (raw.clientResponseDate ? `${raw.clientResponseDate}T${raw.clientResponseTime || '00:00'}` : ''),
    accessories: raw.accessories || '',
    product: raw.product || '',
    district: raw.district || '',
    address: raw.address || '',
    contactPerson: raw.contactPerson || '',
    number: raw.number || '',
    comments: raw.comments || raw.details || '',
    deliveryOption: raw.deliveryOption || '',
    serviceType: raw.serviceType || raw.issueType || '',
    kam: raw.kam || '',
    segment: raw.segment || raw.category || '',
    invoiceHandover: raw.invoiceHandover || '',
    collectionAmount: raw.collectionAmount !== undefined ? raw.collectionAmount : '0',
    paymentMethod: raw.paymentMethod || '',
    installationStatus: raw.installationStatus || '',
    handedOverTo: raw.handedOverTo || '',
    assignPerson: raw.assignPerson || '',
    handoverCollected: (String(raw.handoverCollected || '').toLowerCase() === 'yes') ? 'Yes' : 'No',
    installationDate: raw.installationDate || raw.resolutionDate || '',
    unitQty: raw.unitQty !== undefined ? Number(raw.unitQty) || 1 : 1,
    vendorBillAmount: raw.vendorBillAmount !== undefined ? raw.vendorBillAmount : '0',
    remarks: raw.remarks || '',

    // Legacy fields
    branchName: clientName,
    issueType: raw.serviceType || raw.issueType || '',
    category: raw.segment || raw.category || '',
    odooTicketId: odooId,
    replaceDeviceId: newDevice,
    oldDeviceId: oldDevice,
    location: premesisName,
    date: issueLogDate,
    details: raw.comments || raw.details || '',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}
