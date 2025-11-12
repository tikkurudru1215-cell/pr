import { Complaint, AnalyticsData, District, ServiceCategory } from '../types';

// Mock complaint data
export const mockComplaints: Complaint[] = [
  {
    id: '1',
    title: 'Frequent Power Outages in Sector 15',
    description: 'We are experiencing daily power cuts for 4-6 hours. This is affecting our work and daily life significantly. Please look into this urgent matter.',
    category: 'electricity',
    location: {
      district: 'Karachi Central',
      coordinates: [24.8607, 67.0011]
    },
    timestamp: new Date('2024-01-15'),
    sentiment: 'negative',
    priority: 'high',
    status: 'in-progress',
    userId: 'user1',
    userName: 'Ahmed Ali'
  },
  {
    id: '2',
    title: 'Water Quality Issues in North Nazimabad',
    description: 'The water supply has been contaminated for the past week. Many residents are falling sick. We need immediate action.',
    category: 'water',
    location: {
      district: 'Karachi North',
      coordinates: [24.9056, 67.0367]
    },
    timestamp: new Date('2024-01-14'),
    sentiment: 'negative',
    priority: 'urgent',
    status: 'pending',
    userId: 'user2',
    userName: 'Fatima Khan'
  },
  {
    id: '3',
    title: 'Excellent Healthcare Service at DHQ Hospital',
    description: 'I want to appreciate the excellent service provided by the medical staff at DHQ Hospital. They were very professional and caring.',
    category: 'healthcare',
    location: {
      district: 'Lahore Central',
      coordinates: [31.5204, 74.3587]
    },
    timestamp: new Date('2024-01-13'),
    sentiment: 'positive',
    priority: 'low',
    status: 'resolved',
    userId: 'user3',
    userName: 'Hassan Ahmed'
  },
  {
    id: '4',
    title: 'Damaged Roads Need Urgent Repair',
    description: 'The main road in our area has large potholes that are causing accidents. Several vehicles have been damaged already.',
    category: 'roads',
    location: {
      district: 'Islamabad',
      coordinates: [33.6844, 73.0479]
    },
    timestamp: new Date('2024-01-12'),
    sentiment: 'negative',
    priority: 'high',
    status: 'pending',
    userId: 'user4',
    userName: 'Sadia Malik'
  },
  {
    id: '5',
    title: 'School Infrastructure Improvements Needed',
    description: 'Our local school needs better facilities including proper desks, clean washrooms, and library resources for students.',
    category: 'education',
    location: {
      district: 'Rawalpindi',
      coordinates: [33.5651, 73.0169]
    },
    timestamp: new Date('2024-01-11'),
    sentiment: 'neutral',
    priority: 'medium',
    status: 'in-progress',
    userId: 'user5',
    userName: 'Mohammad Tariq'
  }
];

// Mock analytics data
export const mockAnalytics: AnalyticsData = {
  totalComplaints: 1247,
  resolvedComplaints: 892,
  pendingComplaints: 355,
  sentimentBreakdown: {
    positive: 186,
    negative: 743,
    neutral: 318
  },
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

// Mock district data
export const mockDistricts: District[] = [
  { name: 'Karachi Central', coordinates: [24.8607, 67.0011], complaints: 324, avgSentiment: -0.4 },
  { name: 'Karachi South', coordinates: [24.8608, 67.0104], complaints: 287, avgSentiment: -0.3 },
  { name: 'Karachi North', coordinates: [24.9056, 67.0367], complaints: 198, avgSentiment: -0.5 },
  { name: 'Lahore Central', coordinates: [31.5204, 74.3587], complaints: 156, avgSentiment: 0.1 },
  { name: 'Lahore Cantt', coordinates: [31.5497, 74.3436], complaints: 134, avgSentiment: 0.0 },
  { name: 'Islamabad', coordinates: [33.6844, 73.0479], complaints: 89, avgSentiment: 0.2 },
  { name: 'Rawalpindi', coordinates: [33.5651, 73.0169], complaints: 67, avgSentiment: -0.1 }
];

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