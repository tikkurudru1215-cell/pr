export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ServiceCategory;
  location: {
    district: string;
    coordinates: [number, number];
  };
  timestamp: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  userId: string;
  userName: string;
}

export type ServiceCategory = 
  | 'electricity'
  | 'water'
  | 'healthcare'
  | 'roads'
  | 'education'
  | 'waste-management'
  | 'transportation'
  | 'other';

export interface AnalyticsData {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  categoryBreakdown: Record<ServiceCategory, number>;
  priorityBreakdown: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  monthlyTrends: Array<{
    month: string;
    complaints: number;
    resolved: number;
  }>;
}

// Added type definition for AI Insights
export interface PredictiveInsight {
  title: string;
  type: 'warning' | 'info' | 'success';
  content: string;
}

export interface District {
  name: string;
  coordinates: [number, number];
  complaints: number;
  avgSentiment: number;
}

// FIX: Add a dummy value export to satisfy Node.js ES Module named export requirement for type-only files.
export const dummyExport = true;