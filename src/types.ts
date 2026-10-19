export type TabType =
  | 'dashboard'
  | 'device_issue_tracker'
  | 'device_issue_report'
  | 'service_ticket_tracker'
  | 'service_ticket_report'
  | 'bill_tracker'
  | 'bill_report'
  | 'issue_tracker'
  | 'issue_report'
  | 'devices'
  | 'po'
  | 'service'
  | 'sim'
  | 'branch_report'
  | 'ticket_generator'
  | 'settings'
  | 'backup';

export interface ServiceTicketItem {
  id: string;
  issueNumber: string;
  odooId: string;
  emailFrom?: string;
  emailSubject?: string;
  client: string;
  contactPerson: string;
  contactNumber: string;
  district: string;
  address: string;
  deviceLocation: string;
  locationType: string;
  deviceId: string;
  product: string;
  productPrice?: string;
  segment?: string;
  kam?: string;
  requestDate: string;
  requestTime: string;
  plannedDate: string;
  serviceDate?: string;
  slaThreshold: number;
  resolutionDays?: number | string;
  slaStatus: string;
  issues: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  status: 'Open' | 'Pending' | 'Ongoing' | 'Working' | 'RMA' | 'Repairing' | 'Done' | string;
  replace: 'No' | 'Yes' | string;
  replaceDeviceId?: string;
  assignPerson: string;
  accessories?: string;
  deliveryOption?: string;
  challanBy?: string;
  handedOverTo?: string;
  unitQty?: number;
  invoiceHandover?: string;
  paymentMethod?: string;
  vendorBill?: string;
  remarks?: string;
  visitEmail?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillItem {
  id: string;
  billNumber: string;
  invoiceNumber: string;
  vendor: string;
  client: string;
  clientLocation: string;
  description: string;
  billType: string;
  amount: number;
  handoverDate: string;
  submissionDate: string;
  receivedDate: string;
  paymentDate: string;
  status: 'Pending' | 'Submitted' | 'Partial' | 'Paid';
  approvedBy: string;
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash' | 'Online' | string;
  remarks: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceSupportTicket {
  id: string;
  slNo: number;
  deviceId: string;
  contactDate: string;
  lastCommunication: string;
  deviceLocation: string;
  issueType: string;
  responsibility: 'BBPLC' | 'ITL' | string;
  probableSolvingDate: string;
  ticketStatus: 'Yes' | 'No' | string;
  odooId: string;
  remarks: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IssueTrackerItem {
  id: string;
  // 34 Fields from User HTML Specification
  sl?: number;
  issueLogDate?: string;
  odooId?: string;
  status: 'Open' | 'Pending' | 'OnBoard' | 'Working' | 'Done' | 'OPEN' | 'RESOLVED' | string;
  clientName?: string;
  premesisName?: string;
  priority: 'High' | 'Medium' | 'Low' | 'CRITICAL' | string;
  deviceReplace?: 'Yes' | 'No' | 'YES' | 'NO' | string;
  oldDevice?: string;
  newDevice?: string;
  clientReportingTime?: string; // e.g. YYYY-MM-DDTHH:MM
  responseTime?: string;        // e.g. YYYY-MM-DDTHH:MM
  accessories?: string;
  product?: string;
  district?: string;
  address?: string;
  contactPerson?: string;
  number?: string;
  comments?: string;
  deliveryOption?: string;
  serviceType?: string;
  kam?: string;
  segment?: string;
  invoiceHandover?: string;
  collectionAmount?: string | number;
  paymentMethod?: string;
  installationStatus?: string;
  handedOverTo?: string;
  assignPerson?: string;
  handoverCollected?: 'Yes' | 'No' | string;
  installationDate?: string;
  unitQty?: string | number;
  vendorBillAmount?: string | number;
  remarks?: string;

  // Backward compatibility fields
  branchName?: string;
  issueType?: string;
  category?: string;
  odooTicketId?: string;
  replaceDeviceId?: string;
  oldDeviceId?: string;
  location?: string;
  date?: string;
  clientReportingDate?: string;
  clientResponseDate?: string;
  clientResponseTime?: string;
  resolutionDate?: string;
  resolutionTime?: string;
  details?: string;
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
  slaStatuses?: string[];
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
  remarks?: string;
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
  hiddenModules?: string[];
}

export interface SystemAccessLog {
  id: string;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  userProfile: string; // Profile / User identifier
  laptopProfile: string; // e.g. "HP Pavilion (Windows 11)", "MacBook Pro (macOS)"
  browser: string; // Chrome 124, Edge, etc.
  ipAddress: string; // Public / Network IP
  location: string; // e.g. "Dhaka, Bangladesh"
  isp?: string; // ISP provider
  action: string; // 'Login', 'Session Start', 'Backup Export', 'Backup Restore'
  deviceDetails: {
    screenResolution: string;
    os: string;
    deviceType: string;
    platform: string;
    language: string;
    userAgent: string;
  };
}

export interface LiveActiveUser {
  sessionId: string;
  userProfile: string;
  laptopProfile: string;
  ipAddress: string;
  location: string;
  isp?: string;
  browser: string;
  screenResolution: string;
  os: string;
  deviceType: string;
  currentTab: string;
  onlineSince: string; // ISO string
  lastHeartbeat: number; // timestamp
  isCurrentDevice?: boolean;
}
