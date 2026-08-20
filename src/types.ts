export type TabType =
  | 'dashboard'
  | 'issue_tracker'
  | 'issue_report'
  | 'devices'
  | 'po'
  | 'service'
  | 'sim'
  | 'branch_report'
  | 'backup'
  | 'settings';

export interface IssueTrackerItem {
  id: string;
  branchName: string;
  issueType: string;
  category: string;
  odooTicketId: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  deviceReplace: 'YES' | 'NO';
  replaceDeviceId: string;
  oldDeviceId: string;
  location: string;
  assignPerson: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING_CLIENT' | 'RESOLVED' | 'CLOSED' | string;
  date: string;
  clientReportingDate: string;
  clientReportingTime: string;
  clientResponseDate: string;
  clientResponseTime: string;
  resolutionDate: string;
  resolutionTime: string;
  details: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemOptions {
  deviceStatuses: string[];
  simOperators: string[];
  accessTypes: string[];
  locationTypes: string[];
  issueTypes: string[];
  ticketPriorities: string[];
  ticketStatuses: string[];
  vendors: string[];
  poStatuses: string[];
  simStatuses: string[];
  technicians: string[];
}

export interface Device {
  sl: number;
  category: string;
  status: 'LIVE' | 'OFFLINE' | 'MAINTENANCE';
  sol: string;
  location: string;
  id: string;
  sim: string;
  operator: 'GP' | 'Robi' | 'Banglalink' | 'Teletalk';
  floor: string;
  placement: string;
  accessType: string;
  bm: string;
  price: string;
  district: string;
  installDate: string;
}

export interface Ticket {
  id: string;
  subject: string;
  from: string;
  reqDate: string;
  reqTime: string;
  planDate: string;
  countDate: string;
  provDate: string;
  location: string;
  deviceId: string;
  locType: string;
  issueType: string;
  receivedBy: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'WORKING' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED';
  resTime: number;
  slaThreshold: number;
  slaStatus: string;
  tech: string;
  remarks: string;
  emailDetails: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  category: string;
  qty: number;
  totalPrice: string;
  issueDate: string;
  status: 'COMPLETED' | 'ONGOING' | 'PENDING';
}

export interface SIMItem {
  id: string;
  simNumber: string;
  operator: string;
  assignedDevice: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CategoryGroup {
  id: string;
  title: string;
  icon: string; // 'branch' | 'security' | 'infra' | 'headoffice'
  items: string[];
}

export interface AppSettings {
  appName: string;
  appLogo: string; // base64 data URL or web image URL
  tagline?: string;
}
