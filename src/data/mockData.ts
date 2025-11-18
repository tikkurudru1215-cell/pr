import type { Complaint, AnalyticsData, District, ServiceCategory } from '../types/index.ts'; // FIX: Using 'import type'

// Mock complaint data (UPDATED to Indian context)
export const mockComplaints: Complaint[] = [
  {
    id: '1',
    title: 'Frequent Power Outages in Sector 15, Mumbai',
    description: 'We are experiencing daily power cuts for 4-6 hours. This is affecting our work and daily life significantly. Please look into this urgent matter.',
    category: 'electricity',
    location: {
      district: 'Mumbai Central',
      coordinates: [18.9667, 72.8333] // Mumbai Central
    },
    timestamp: new Date('2024-01-15'),
    sentiment: 'negative',
    priority: 'high',
    status: 'in-progress',
    userId: 'user1',
    userName: 'Akash Sharma' // Updated name
  },
  {
    id: '2',
    title: 'Water Quality Issues in Bandra, Mumbai',
    description: 'The water supply has been contaminated for the past week. Many residents are falling sick. We need immediate action.',
    category: 'water',
    location: {
      district: 'Mumbai North',
      coordinates: [19.0760, 72.8777] // Mumbai North
    },
    timestamp: new Date('2024-01-14'),
    sentiment: 'negative',
    priority: 'urgent',
    status: 'pending',
    userId: 'user2',
    userName: 'Priya Singh' // Updated name
  },
  {
    id: '3',
    title: 'Excellent Healthcare Service at Victoria Hospital, Bengaluru',
    description: 'I want to appreciate the excellent service provided by the medical staff at Victoria Hospital. They were very professional and caring.',
    category: 'healthcare',
    location: {
      district: 'Bengaluru Central',
      coordinates: [12.9716, 77.5946] // Bengaluru Central
    },
    timestamp: new Date('2024-01-13'),
    sentiment: 'positive',
    priority: 'low',
    status: 'resolved',
    userId: 'user3',
    userName: 'Rohit Verma' // Updated name
  },
  {
    id: '4',
    title: 'Damaged Roads in South Delhi Need Urgent Repair',
    description: 'The main road in our area has large potholes that are causing accidents. Several vehicles have been damaged already.',
    category: 'roads',
    location: {
      district: 'Delhi NCR',
      coordinates: [28.7041, 77.1025] // Delhi
    },
    timestamp: new Date('2024-01-12'),
    sentiment: 'negative',
    priority: 'high',
    status: 'pending',
    userId: 'user4',
    userName: 'Sneha Rao' // Updated name
  },
  {
    id: '5',
    title: 'School Infrastructure Improvements Needed in Noida',
    description: 'Our local school needs better facilities including proper desks, clean washrooms, and library resources for students.',
    category: 'education',
    location: {
      district: 'Noida',
      coordinates: [28.5355, 77.3910] // Noida
    },
    timestamp: new Date('2024-01-11'),
    sentiment: 'neutral',
    priority: 'medium',
    status: 'in-progress',
    userId: 'user5',
    userName: 'Mohan Tariq' // Updated name
  }
];

// Mock analytics data (RESTORED)
export const mockAnalytics: AnalyticsData = {
  totalComplaints: 1247,
  resolvedComplaints: 892,
  pendingComplaints: 355,
  categoryBreakdown: {
    electricity: 387,
    water: 298,
    healthcare: 156,
    roads: 198,
    education: 134,
    'waste-management': 74,
    transportation: 45,
    other: 32
  },
  priorityBreakdown: {
    low: 198,
    medium: 456,
    high: 387,
    urgent: 206
  },
  monthlyTrends: [
    { month: 'Jul', complaints: 98, resolved: 67 },
    { month: 'Aug', complaints: 124, resolved: 89 },
    { month: 'Sep', complaints: 156, resolved: 112 },
    { month: 'Oct', complaints: 189, resolved: 145 },
    { month: 'Nov', complaints: 167, resolved: 134 },
    { month: 'Dec', complaints: 198, resolved: 156 },
    { month: 'Jan', complaints: 215, resolved: 189 }
  ]
};

// Mock district data (UPDATED to Indian context)
export const mockDistricts: District[] = [
  { name: 'Mumbai Central', coordinates: [18.9667, 72.8333], complaints: 324, avgSentiment: -0.4 },
  { name: 'Mumbai North', coordinates: [19.0760, 72.8777], complaints: 287, avgSentiment: -0.3 },
  { name: 'Bengaluru West', coordinates: [12.9716, 77.5946], complaints: 198, avgSentiment: -0.5 },
  { name: 'Chennai Central', coordinates: [13.0827, 80.2707], complaints: 156, avgSentiment: 0.1 },
  { name: 'Hyderabad South', coordinates: [17.3850, 78.4867], complaints: 134, avgSentiment: 0.0 },
  { name: 'Delhi NCR', coordinates: [28.7041, 77.1025], complaints: 89, avgSentiment: 0.2 },
  { name: 'Noida', coordinates: [28.5355, 77.3910], complaints: 67, avgSentiment: -0.1 }
];

// Keep colors as they are constants, not mock data
export const categoryColors: Record<ServiceCategory, string> = {
  electricity: '#ef4444',
  water: '#3b82f6',
  healthcare: '#22c55e',
  roads: '#f59e0b',
  education: '#8b5cf6',
  'waste-management': '#06b6d4',
  transportation: '#f97316',
  other: '#6b7280'
};

export const priorityColors = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444'
};