import React, { useState, useEffect } from 'react'; 
import axios from 'axios'; 
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '../common/StatCard';

// Use hardcoded colors
const categoryColors: Record<string, string> = {
    electricity: '#ef4444', water: '#3b82f6', healthcare: '#22c55e', roads: '#f59e0b',
    education: '#8b5cf6', 'waste-management': '#06b6d4', transportation: '#f97316', other: '#6b7280'
};
const priorityColors: Record<string, string> = {
    low: '#22c55e', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444'
};

// Define the basic structure (Sentiment Breakdown removed)
interface AnalyticsData {
    totalComplaints: number;
    resolvedComplaints: number;
    pendingComplaints: number;
    categoryBreakdown: Record<string, number>;
    priorityBreakdown: Record<string, number>;
    monthlyTrends: Array<{ month: string; complaints: number; resolved: number }>;
}

// Interface for PieChart labels
interface LabelPayload {
  name?: string;
  priority?: string;
  percent?: number; 
  value?: number;
  count?: number;
}


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- NEW AI INSIGHTS LOGIC (Must be Logical) ---
const generateInsights = (analytics: AnalyticsData): { title: string, text: string, color: 'danger' | 'warning' | 'success' }[] => {
    
    // Helper to find the max value key in a breakdown object
    const getTopCategory = (breakdown: Record<string, number>): string => {
        return Object.entries(breakdown).reduce((a, b) => a[1] > b[1] ? a : b)[0] || 'other';
    };

    const topCategory = getTopCategory(analytics.categoryBreakdown);
    const resolutionRate = analytics.resolvedComplaints / analytics.totalComplaints;
    const lastMonth = analytics.monthlyTrends[analytics.monthlyTrends.length - 2];
    const currentMonth = analytics.monthlyTrends[analytics.monthlyTrends.length - 1];

    const insights = [];

    // 1. Critical Pattern (Focus on Top Complaint Category)
    if (analytics.categoryBreakdown[topCategory] > analytics.totalComplaints * 0.25) {
        insights.push({
            title: '⚡ Critical Issue Alert',
            text: `${topCategory.toUpperCase()} complaints represent over 25% of all cases. Immediate resource allocation is needed.`,
            color: 'danger' as const
        });
    } else {
        insights.push({
            title: '👍 Stable Categories',
            text: 'No single service category dominates the complaint volume, suggesting balanced performance across departments.',
            color: 'success' as const
        });
    }

    // 2. Predictive Alert (Focus on Pending vs Resolution Rate)
    if (resolutionRate < 0.6) {
        insights.push({
            title: '🔮 Resolution Warning',
            text: `The overall resolution rate is low (${(resolutionRate * 100).toFixed(0)}%). Backlog risk is high for next quarter.`,
            color: 'warning' as const
        });
    } else {
         insights.push({
            title: '🎉 Efficiency Boost',
            text: `High resolution rate (${(resolutionRate * 100).toFixed(0)}%) indicates effective operational performance and fast service delivery.`,
            color: 'success' as const
        });
    }

    // 3. Trend Analysis (Focus on growth rate of complaints)
    if (lastMonth && currentMonth && currentMonth.complaints > lastMonth.complaints * 1.2) {
        insights.push({
            title: '📈 Sudden Spike Detected',
            text: `Complaints increased by ${(100 * (currentMonth.complaints - lastMonth.complaints) / lastMonth.complaints).toFixed(0)}% this month. Investigate the cause quickly.`,
            color: 'danger' as const
        });
    } else {
        insights.push({
            title: '⏱️ Consistent Volume',
            text: 'Complaint volume remains steady month-over-month. Focus can remain on process optimization.',
            color: 'warning' as const
        });
    }

    return insights;
};
// --- END NEW AI INSIGHTS LOGIC ---


const Dashboard: React.FC = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [aiInsights, setAiInsights] = useState<ReturnType<typeof generateInsights>>([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/admin/analytics`);
                const fetchedAnalytics: AnalyticsData = response.data;
                setAnalytics(fetchedAnalytics);
                setAiInsights(generateInsights(fetchedAnalytics)); // Generate insights right after fetching
            } catch (error) {
                console.error("Failed to fetch dashboard analytics:", error);
                // Fallback to initial mock data if API fails
                const { mockAnalytics } = await import('../../data/mockData');
                // Temporarily remove sentiment key from mock to align structure
                const { sentimentBreakdown, ...safeMockAnalytics } = mockAnalytics;
                setAnalytics(safeMockAnalytics as unknown as AnalyticsData);
                setAiInsights(generateInsights(safeMockAnalytics as unknown as AnalyticsData));
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading || !analytics) {
        return (
            <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-xl text-gray-700">Loading Dashboard Data...</p>
            </div>
        );
    }
    
    // Use data from the state/API
    const {
        totalComplaints, resolvedComplaints, pendingComplaints,
        categoryBreakdown, priorityBreakdown, monthlyTrends
    } = analytics;

    const resolutionRate = totalComplaints > 0 ? (resolvedComplaints / totalComplaints) : 0;
    
    const categoryData = Object.entries(categoryBreakdown).map(([category, count]) => ({
        category: category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
        color: categoryColors[category as keyof typeof categoryColors] || '#6b7280'
    }));

    const priorityData = Object.entries(priorityBreakdown).map(([priority, count]) => ({
        priority: priority.charAt(0).toUpperCase() + priority.slice(1),
        count,
        color: priorityColors[priority as keyof typeof priorityColors] || '#6b7280'
    }));
    
    return (
        <motion.div
        className="space-y-10 p-4 sm:p-6 md:p-8 animate-fade-in"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        >
        {/* Header */}
        <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">📊 Analytics Dashboard</h2>
            <p className="text-gray-600 text-lg">Real-time insights powered by AI analysis</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard 
              title="Total Complaints" 
              value={totalComplaints} 
              icon={Activity} 
              color="primary" 
              trend={{ 
                  value: Math.abs(12), 
                  isPositive: false 
              }} 
            />
            <StatCard 
              title="Resolved Cases" 
              value={resolvedComplaints} 
              icon={CheckCircle} 
              color="success" 
              trend={{ 
                  value: Math.abs(8), 
                  isPositive: true 
              }} 
            />
            <StatCard 
              title="Pending Cases" 
              value={pendingComplaints} 
              icon={Clock} 
              color="warning" 
              trend={{ 
                  value: Math.abs(5), 
                  isPositive: false 
              }} 
            />
            <StatCard 
              title="Resolution Rate" 
              // Ensure percentage is calculated from live data
              value={`${Math.round(resolutionRate * 100)}%`} 
              icon={TrendingUp} 
              color="success" 
              trend={{ 
                  value: Math.abs(3), 
                  isPositive: true 
              }} 
            />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Breakdown */}
            <motion.div
            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 lg:col-span-1" 
            whileHover={{ scale: 1.02 }}
            >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </motion.div>

            {/* Priority Breakdown */}
            <motion.div
            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 lg:col-span-1" 
            whileHover={{ scale: 1.02 }}
            >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="count"
                    label={({ priority, percent }: LabelPayload) => `${priority} ${(percent! * 100).toFixed(0)}%`}
                >
                    {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            </motion.div>
            
            {/* Monthly Trends (Full Width) */}
            <motion.div
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 lg:col-span-2" 
                whileHover={{ scale: 1.02 }}
            >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Trends (Complaints vs. Resolved)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="complaints" stroke="#ef4444" strokeWidth={3} name="Complaints" />
                <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={3} name="Resolved" />
                </LineChart>
            </ResponsiveContainer>
            </motion.div>
        </div>

        {/* AI Insights (Using new local logic) */}
        <motion.div
            className="bg-gradient-to-r from-primary-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg"
            whileHover={{ scale: 1.01 }}
        >
            <div className="flex items-center space-x-3 mb-4">
            <Zap className="h-6 w-6 text-yellow-300" />
            <h3 className="text-lg font-semibold">AI Predictive Insights for Future Problems</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiInsights.map((insight, index) => {
                 const icon = insight.color === 'danger' ? AlertTriangle : insight.color === 'warning' ? Clock : CheckCircle;
                 const bgColor = insight.color === 'danger' ? 'bg-danger-800/20' : insight.color === 'warning' ? 'bg-warning-800/20' : 'bg-success-800/20';
                 const Icon = icon;

                return (
                    <div key={index} className={`${bgColor} backdrop-blur-sm p-4 rounded-lg border border-white/20`}>
                        <Icon className="h-6 w-6 mb-2 text-white/80" />
                        <h4 className="font-medium mb-2">{insight.title}</h4>
                        <p className="text-sm opacity-90">{insight.text}</p>
                    </div>
                );
            })}
            </div>
        </motion.div>
        </motion.div>
    );
};

export default Dashboard;