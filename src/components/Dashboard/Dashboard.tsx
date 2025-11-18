import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line // Removed unused 'Label' import
} from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react'; 
import { motion } from 'framer-motion';
import StatCard from '../common/StatCard';
import { categoryColors, priorityColors } from '../../data/mockData';
import { AnalyticsData, ServiceCategory } from '../../types';
import { generatePredictiveInsights } from '../../utils/aiAnalyzer';

// Define type for Pie chart label properties, minimally, with index signature to handle extra props from Recharts
interface PieLabelData {
  priority?: string;
  percent?: number;
  [key: string]: any; // Allows any other props (like cx, cy, etc.) passed by Recharts to prevent TS conflict
}

// Define the shape of the data expected from the API 
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const initialAnalyticsData: AnalyticsData = {
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    categoryBreakdown: {
        'electricity': 0, 'water': 0, 'healthcare': 0, 'roads': 0, 
        'education': 0, 'waste-management': 0, 'transportation': 0, 'other': 0
    },
    priorityBreakdown: {
        low: 0, medium: 0, high: 0, urgent: 0
    },
    monthlyTrends: [],
};

const Dashboard: React.FC = () => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(initialAnalyticsData);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Fetch data from the new backend endpoint
                const response = await axios.get<AnalyticsData>(`${API_URL}/api/analytics`);
                setAnalyticsData(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
                setError('Failed to load analytics data. Please ensure the backend is running and MongoDB is connected.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const {
        totalComplaints, resolvedComplaints, pendingComplaints,
        categoryBreakdown, priorityBreakdown, monthlyTrends
    } = analyticsData;

    // --- Data Preparation ---
    const categoryData = Object.entries(categoryBreakdown).map(([category, count]) => ({
        category: category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
        color: categoryColors[category as ServiceCategory]
    }));

    const priorityData = Object.entries(priorityBreakdown).map(([priority, count]) => ({
        priority: priority.charAt(0).toUpperCase() + priority.slice(1),
        count,
        color: priorityColors[priority as keyof typeof priorityColors]
    }));

    // Generate AI Insights using the fetched data (using the modified logic)
    const aiInsights = generatePredictiveInsights(analyticsData);

    if (isLoading) {
        return (
            <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-900">Loading Dashboard Data...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center py-20 text-danger-600 border border-danger-300 rounded-xl p-6 bg-danger-50">
                <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
                <p className="text-xl font-medium">{error}</p>
            </div>
        );
    }

    // Mock trends for Stat Cards 
    const trendValue = Math.round(Math.random() * 10) + 1;
    const isPositiveTrend = Math.random() > 0.5;
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

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

            {/* Stat Cards (Connected to API data) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Complaints" 
                    value={totalComplaints} 
                    icon={Activity} 
                    color="primary" 
                    trend={{ value: trendValue, isPositive: isPositiveTrend }} 
                />
                <StatCard 
                    title="Resolved Cases" 
                    value={resolvedComplaints} 
                    icon={CheckCircle} 
                    color="success" 
                    trend={{ value: trendValue, isPositive: isPositiveTrend }} 
                />
                <StatCard 
                    title="Pending Cases" 
                    value={pendingComplaints} 
                    icon={Clock} 
                    color="warning" 
                    trend={{ value: trendValue, isPositive: isPositiveTrend }} 
                />
                <StatCard 
                    title="Resolution Rate" 
                    value={`${resolutionRate}%`} 
                    icon={TrendingUp} 
                    color="success" 
                    trend={{ value: trendValue, isPositive: isPositiveTrend }} 
                />
            </div>

            {/* Charts Grid - Removed Sentiment Analysis Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Category Breakdown (Bar Chart) */}
                <motion.div
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
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

                {/* 2. Priority Distribution (Pie Chart) - Replaced Sentiment Chart */}
                <motion.div
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
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
                                innerRadius={60} 
                                dataKey="count"
                                // Fix: Use the PieLabelData interface for type safety
                                label={({ priority, percent }: PieLabelData) => `${priority} ${((percent as number || 0) * 100).toFixed(0)}%`}
                            >
                                {priorityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
                
                {/* 3. Monthly Trends (Line Chart - Now spans full width) */}
                <motion.div
                    className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
                    whileHover={{ scale: 1.02 }}
                >
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Trends</h3>
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

            {/* AI Insights (Using new logical insights) */}
            <motion.div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg"
                whileHover={{ scale: 1.01 }}
            >
                <div className="flex items-center space-x-3 mb-4">
                    <Zap className="h-6 w-6 text-yellow-300" />
                    <h3 className="text-lg font-semibold">AI-Powered Predictive Insights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiInsights.map((insight, index) => (
                        <div 
                            key={index} 
                            className={`p-4 rounded-lg backdrop-blur-sm ${
                                insight.type === 'warning' ? 'bg-danger-500/10 border border-danger-400 text-red-50' : 
                                insight.type === 'success' ? 'bg-success-500/10 border border-success-400 text-green-50' :
                                'bg-white/10 border border-blue-400/50'
                            }`}
                        >
                            <h4 className="font-medium mb-2">{insight.title}</h4>
                            <p className="text-sm opacity-90">{insight.content}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;