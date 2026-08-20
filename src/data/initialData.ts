import { Device, Ticket, PurchaseOrder, SIMItem, CategoryGroup, SystemOptions, IssueTrackerItem } from '../types';

export const initialDevices: Device[] = [];

export const initialTickets: Ticket[] = [];

export const initialPOs: PurchaseOrder[] = [];

export const initialSIMs: SIMItem[] = [];

export const initialIssues: IssueTrackerItem[] = [];

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

