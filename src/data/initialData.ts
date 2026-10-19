import { Device, Ticket, PurchaseOrder, SIMItem, CategoryGroup, SystemOptions, IssueTrackerItem, DeviceSupportTicket, BillItem, ServiceTicketItem } from '../types';

export const initialClients: string[] = ['Black Bank PLC'];

export const initialBillLocations: string[] = [
  'Gulistan Branch',
  'Dhanmondi Branch',
  'Motijheel Branch',
  'Uttara Branch',
  'Banani Branch',
  'Head Office',
];

export const initialBillCategories: string[] = [
  'Installation Support',
  'Location Shift',
  'Annual Maintenance',
  'Hardware Repair',
  'Network Cabling',
];

export const initialBills: BillItem[] = [];

export const initialServiceTickets: ServiceTicketItem[] = [];

export const initialDevices: Device[] = [];

export const initialTickets: Ticket[] = [];

export const initialPOs: PurchaseOrder[] = [];

export const initialSIMs: SIMItem[] = [];

export const initialIssues: IssueTrackerItem[] = [];

export const initialDeviceSupportTickets: DeviceSupportTicket[] = [
  {
    id: 'DST-1001',
    slNo: 1,
    deviceId: 'DEV-1029',
    contactDate: '2026-10-02',
    lastCommunication: '2026-10-02',
    deviceLocation: 'Gulistan Branch, Dhaka',
    issueType: 'Sim Connectivity, Power connectivity',
    responsibility: 'ITL',
    probableSolvingDate: '2026-10-04',
    ticketStatus: 'Yes',
    odooId: 'ODOO-88219',
    remarks: 'Replaced internal fuse and rebooted SIM module',
  },
  {
    id: 'DST-1002',
    slNo: 2,
    deviceId: 'DEV-1030',
    contactDate: '2026-10-05',
    lastCommunication: '2026-10-05',
    deviceLocation: 'Gulistan Branch, Dhaka',
    issueType: 'Display Damage',
    responsibility: 'BBPLC',
    probableSolvingDate: '2026-10-07',
    ticketStatus: 'No',
    odooId: 'N/A',
    remarks: 'Display glass crack reported by branch officer',
  },
  {
    id: 'DST-1003',
    slNo: 3,
    deviceId: 'DEV-2041',
    contactDate: '2026-10-06',
    lastCommunication: '2026-10-06',
    deviceLocation: 'Agrabad Branch, Chattogram',
    issueType: 'Beeper Problem, Sensor',
    responsibility: 'ITL',
    probableSolvingDate: '2026-10-09',
    ticketStatus: 'Yes',
    odooId: 'ODOO-88301',
    remarks: 'Beeping continuously on punch in/out',
  },
  {
    id: 'DST-1004',
    slNo: 4,
    deviceId: 'DEV-3052',
    contactDate: '2026-10-08',
    lastCommunication: '2026-10-08',
    deviceLocation: 'Mirpur-10 Branch, Dhaka',
    issueType: 'Location Shift',
    responsibility: 'BBPLC',
    probableSolvingDate: '2026-10-10',
    ticketStatus: 'No',
    odooId: 'N/A',
    remarks: 'Shifted terminal from Ground floor to Cash counter',
  },
  {
    id: 'DST-1005',
    slNo: 5,
    deviceId: 'DEV-1029',
    contactDate: '2026-10-09',
    lastCommunication: '2026-10-09',
    deviceLocation: 'Gulistan Branch, Dhaka',
    issueType: 'Push Button, Debug Mood',
    responsibility: 'ITL',
    probableSolvingDate: '2026-10-12',
    ticketStatus: 'Yes',
    odooId: 'ODOO-88412',
    remarks: 'Second visit this month; stuck in debug mode',
  },
];

export const initialSystemOptions: SystemOptions = {
  deviceStatuses: ['LIVE', 'OFFLINE', 'MAINTENANCE'],
  simOperators: ['GP', 'Robi', 'Banglalink', 'Teletalk'],
  accessTypes: ['ENTRY/EXIT', 'BIOMETRIC', 'FACE RECOGNITION', 'CARD READ', 'SECURITY DOOR'],
  locationTypes: ['Main Branch', 'Sub Branch', 'Head Office', 'Data Centre', 'SME Branch'],
  issueTypes: [
    'Network Disconnection',
    'Power Failure',
    'Hardware Breakdown',
    'SIM Swap',
    'ATM Link Down',
    'DVR/Camera Off',
    'UPS Fault',
  ],
  ticketPriorities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
  ticketStatuses: ['OPEN', 'WORKING', 'ASSIGNED', 'RESOLVED', 'CLOSED'],
  vendors: ['BracNet Ltd', 'Flora Systems', 'Smart Technologies', 'Unique Business Systems', 'DataEdge'],
  poStatuses: ['PENDING', 'ONGOING', 'COMPLETED'],
  simStatuses: ['ACTIVE', 'INACTIVE'],
  technicians: ['Rahim Ahmed', 'Karim Ullah', 'Shakil Hossain', 'Support Engineer Team'],
  slaStatuses: ['WITHIN SLA', 'SLA BREACH', 'NEAR BREACH', 'RESOLVED IN SLA', 'PENDING'],
};

export const initialCategoryGroups: CategoryGroup[] = [
  {
    id: "branch",
    title: "Branch MIS",
    icon: "branch",
    items: ["Main Branch", "Sub Branch", "SME Branch"]
  },
  {
    id: "sec",
    title: "Info Security",
    icon: "security",
    items: ["Data Centre (DC)", "Data Reservation (DR)"]
  },
  {
    id: "infra",
    title: "Infrastructure",
    icon: "infra",
    items: ["ATMSC", "DPDC"]
  },
  {
    id: "ho",
    title: "Head Office",
    icon: "headoffice",
    items: ["All Head Office Units"]
  }
];

