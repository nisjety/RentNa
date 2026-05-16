export type JobStatus = 'completed' | 'in_progress' | 'upcoming';

export interface ChecklistItem {
  id: string;
  label: string;
  room: string;
  done: boolean;
}

export interface CleanerJob {
  id: string;
  customerName: string;
  customerInitials: string;
  address: string;
  area: string;
  service: string;
  serviceType: 'home' | 'deep' | 'move' | 'office';
  startsAt: string;
  durationHours: number;
  status: JobStatus;
  hourlyRateKr: number;
  totalKr: number;
  floor?: string;
  accessCode?: string;
  notes?: string;
  checklistItems: ChecklistItem[];
}

export interface CleanerRequest {
  id: string;
  customerName: string;
  customerInitials: string;
  service: string;
  serviceType: 'home' | 'deep' | 'move' | 'office';
  address: string;
  area: string;
  proposedDate: string;
  durationHours: number;
  proposedRateKr: number;
  message?: string;
}

export interface MonthlyBar {
  month: string;
  kr: number;
}

export interface Payout {
  id: string;
  date: string;
  kr: number;
  status: 'paid' | 'pending';
}

function at(hour: number, min = 0): string {
  const d = new Date();
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

export const mockCleanerJobs: CleanerJob[] = [
  {
    id: 'j_001',
    customerName: 'Emma Larsen',
    customerInitials: 'EL',
    address: 'Thorvald Meyers gate 14',
    area: 'Grünerløkka',
    service: 'Hjemvask',
    serviceType: 'home',
    startsAt: at(9, 0),
    durationHours: 2,
    status: 'completed',
    hourlyRateKr: 380,
    totalKr: 760,
    checklistItems: [],
  },
  {
    id: 'j_002',
    customerName: 'Henrik Stavnes',
    customerInitials: 'HS',
    address: 'Bogstadveien 52',
    area: 'St. Hanshaugen',
    service: 'Hjemvask',
    serviceType: 'home',
    startsAt: at(11, 30),
    durationHours: 2.5,
    status: 'in_progress',
    hourlyRateKr: 380,
    totalKr: 950,
    floor: '3. etg',
    accessCode: '#4812',
    notes: 'Hunden heter Max — rolig og vennlig.',
    checklistItems: [
      { id: 'c1', label: 'Støvsug stue', room: 'Stue', done: true },
      { id: 'c2', label: 'Vask gulv stue', room: 'Stue', done: true },
      { id: 'c3', label: 'Støvsug soverom', room: 'Soverom', done: false },
      { id: 'c4', label: 'Skrubb baderom', room: 'Bad', done: false },
      { id: 'c5', label: 'Tørk kjøkkenflater', room: 'Kjøkken', done: false },
      { id: 'c6', label: 'Ta søppel', room: 'Kjøkken', done: false },
    ],
  },
  {
    id: 'j_003',
    customerName: 'Ida Berg',
    customerInitials: 'IB',
    address: 'Maridalsveien 17',
    area: 'Sagene',
    service: 'Dypvask',
    serviceType: 'deep',
    startsAt: at(14, 30),
    durationHours: 3,
    status: 'upcoming',
    hourlyRateKr: 380,
    totalKr: 1140,
    checklistItems: [],
  },
];

export const mockCleanerRequests: CleanerRequest[] = [
  {
    id: 'req_001',
    customerName: 'Lars Kristiansen',
    customerInitials: 'LK',
    service: 'Hjemvask',
    serviceType: 'home',
    address: 'Frognerveien 23',
    area: 'Frogner',
    proposedDate: daysFromNow(2),
    durationHours: 2,
    proposedRateKr: 380,
    message: 'Har en labrador. Er hunder ok?',
  },
  {
    id: 'req_002',
    customerName: 'Marte Holt',
    customerInitials: 'MH',
    service: 'Dypvask',
    serviceType: 'deep',
    address: 'Pilestredet 45',
    area: 'St. Hanshaugen',
    proposedDate: daysFromNow(4),
    durationHours: 4,
    proposedRateKr: 380,
    message: 'Tre-roms, 80 kvm. Trenger grundig vask av kjøkken og bad.',
  },
  {
    id: 'req_003',
    customerName: 'Ole Strand',
    customerInitials: 'OS',
    service: 'Kontorrenhold',
    serviceType: 'office',
    address: 'Karl Johans gate 7',
    area: 'Sentrum',
    proposedDate: daysFromNow(5),
    durationHours: 3,
    proposedRateKr: 420,
  },
];

export const mockEarnings = {
  thisWeek: { totalKr: 3420, jobsCount: 9, hoursWorked: 18 },
  thisMonth: { totalKr: 14260, jobsCount: 37, hoursWorked: 74 },
  ytd: { totalKr: 68900, jobsCount: 181, hoursWorked: 362 },
  monthlyBars: [
    { month: 'Jan', kr: 9800 },
    { month: 'Feb', kr: 11200 },
    { month: 'Mar', kr: 10600 },
    { month: 'Apr', kr: 13100 },
    { month: 'Mai', kr: 14260 },
  ] as MonthlyBar[],
  recentPayouts: [
    { id: 'p1', date: new Date(Date.now() - 3 * 864e5).toISOString(), kr: 3800, status: 'paid' },
    { id: 'p2', date: new Date(Date.now() - 10 * 864e5).toISOString(), kr: 4100, status: 'paid' },
    { id: 'p3', date: new Date(Date.now() - 17 * 864e5).toISOString(), kr: 3760, status: 'paid' },
  ] as Payout[],
};

export function getJobById(id: string): CleanerJob | undefined {
  return mockCleanerJobs.find((j) => j.id === id);
}
