import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '../common/StatCard';
import { mockAnalytics, categoryColors, priorityColors } from '../../data/mockData';

const Dashboard: React.FC = () => {
  const {
    totalComplaints, resolvedComplaints, pendingComplaints,
    sentimentBreakdown, categoryBreakdown, priorityBreakdown, monthlyTrends
  } = mockAnalytics;

  const categoryData = Object.entries(categoryBreakdown).map(([category, count]) => ({
    category: category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count,
    color: categoryColors[category as keyof typeof categoryColors]
  }));

  const priorityData = Object.entries(priorityBreakdown).map(([priority, count]) => ({
    priority: priority.charAt(0).toUpperCase() + priority.slice(1),
    count,
    color: priorityColors[priority as keyof typeof priorityColors]
  }));

  const sentimentData = [
    { name: 'Positive', value: sentimentBreakdown.positive, color: '#22c55e' },
    { name: 'Negative', value: sentimentBreakdown.negative, color: '#ef4444' },
    { name: 'Neutral', value: sentimentBreakdown.neutral, color: '#6b7280' }
  ];

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
        <StatCard title="Total Complaints" value={totalComplaints} icon={Activity} color="primary" trend={{ value: 12, isPositive: false }} />
        <StatCard title="Resolved Cases" value={resolvedComplaints} icon={CheckCircle} color="success" trend={{ value: 8, isPositive: true }} />
        <StatCard title="Pending Cases" value={pendingComplaints} icon={Clock} color="warning" trend={{ value: 5, isPositive: false }} />
        <StatCard title="Resolution Rate" value={`${Math.round((resolvedComplaints / totalComplaints) * 100)}%`} icon={TrendingUp} color="success" trend={{ value: 3, isPositive: true }} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
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

        {/* Sentiment Analysis */}
        <motion.div
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
          whileHover={{ scale: 1.02 }}
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4">AI Sentiment Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Priority Breakdown */}
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
                dataKey="count"
                label={({ priority, percent }) => `${priority} ${(percent * 100).toFixed(0)}%`}
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly Trends */}
        <motion.div
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
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

      {/* AI Insights */}
      <motion.div
        className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg"
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-300" />
          <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <h4 className="font-medium mb-2">⚡ Critical Pattern Detected</h4>
            <p className="text-sm opacity-90">Electricity complaints spike 340% during summer months.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <h4 className="font-medium mb-2">🔮 Predictive Alert</h4>
            <p className="text-sm opacity-90">Water supply issues may increase by 25% next month.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <h4 className="font-medium mb-2">🎉 Success Story</h4>
            <p className="text-sm opacity-90">Healthcare sentiment improved 45% after recent initiatives.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
