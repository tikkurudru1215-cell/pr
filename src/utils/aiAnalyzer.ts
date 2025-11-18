import type { Complaint, ServiceCategory, AnalyticsData, PredictiveInsight } from '../types/index.ts'; // FIX: Using 'import type'

// Mock AI sentiment analysis
export const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
  const positiveWords = ['good', 'excellent', 'great', 'amazing', 'wonderful', 'fantastic', 'appreciate', 'thank', 'helpful', 'professional'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'urgent', 'emergency', 'damaged', 'broken', 'contaminated', 'sick', 'dangerous'];
  
  const lowerText = text.toLowerCase();
  const positiveScore = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeScore = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
};

// Mock AI complaint classification
export const classifyComplaint = (text: string): ServiceCategory => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('power') || lowerText.includes('electricity') || lowerText.includes('outage')) return 'electricity';
  if (lowerText.includes('water') || lowerText.includes('supply') || lowerText.includes('contaminated')) return 'water';
  if (lowerText.includes('hospital') || lowerText.includes('health') || lowerText.includes('medical')) return 'healthcare';
  if (lowerText.includes('road') || lowerText.includes('pothole') || lowerText.includes('street')) return 'roads';
  if (lowerText.includes('school') || lowerText.includes('education') || lowerText.includes('teacher')) return 'education';
  if (lowerText.includes('waste') || lowerText.includes('garbage') || lowerText.includes('trash')) return 'waste-management';
  if (lowerText.includes('transport') || lowerText.includes('bus') || lowerText.includes('train')) return 'transportation';
  
  return 'other';
};

// Mock AI priority prediction
export const predictPriority = (text: string): 'low' | 'medium' | 'high' | 'urgent' => {
  const lowerText = text.toLowerCase();
  const urgentWords = ['urgent', 'emergency', 'dangerous', 'life-threatening', 'immediate'];
  const highWords = ['serious', 'major', 'significant', 'important', 'critical'];
  const mediumWords = ['moderate', 'concerning', 'needs attention'];
  
  if (urgentWords.some(word => lowerText.includes(word))) return 'urgent';
  if (highWords.some(word => lowerText.includes(word))) return 'high';
  if (mediumWords.some(word => lowerText.includes(word))) return 'medium';
  
  return 'low';
};

// --- NEW: Logical AI Insight Function ---
export const generatePredictiveInsights = (data: AnalyticsData): PredictiveInsight[] => {
    
    // 1. Calculate Highest Volume Category
    const categories = Object.entries(data.categoryBreakdown).sort(([, a], [, b]) => b - a);
    const mostComplainedCategory = categories.length > 0 ? categories[0][0] as ServiceCategory : 'other';

    // 2. Identify highest Priority
    const priorities = Object.entries(data.priorityBreakdown).sort(([, a], [, b]) => b - a);
    const highestPriority = priorities.length > 0 ? priorities[0][0] : 'low';

    // 3. Trend Analysis (Comparing last two months)
    const lastMonth = data.monthlyTrends[data.monthlyTrends.length - 1];
    const prevMonth = data.monthlyTrends[data.monthlyTrends.length - 2];
    
    let trendInsight: PredictiveInsight = { title: '💡 Trend Analysis', type: 'info', content: "Monthly volume is stable. Monitoring advised." };
    if (prevMonth && lastMonth.complaints > prevMonth.complaints * 1.2) {
        const percentIncrease = (((lastMonth.complaints - prevMonth.complaints) / prevMonth.complaints) * 100).toFixed(0);
        trendInsight = { 
            title: '📈 Volume Alert', 
            type: 'warning', 
            content: `Overall complaint volume spiked by ${percentIncrease}% last month. Systemic issues may be emerging.` 
        };
    } else if (prevMonth && lastMonth.resolved > prevMonth.resolved && lastMonth.complaints > lastMonth.resolved * 1.5) {
        trendInsight = { 
            type: 'warning', 
            title: '⚠️ Bottleneck Warning', 
            content: "Resolved cases increased, but complaints are rising much faster. There's a processing bottleneck."
        };
    }
    
    // 4. Predictive Insights List
    return [
        {
            title: '⚡ Critical Focus Area',
            type: highestPriority === 'urgent' ? 'warning' : 'info',
            content: highestPriority !== 'low' 
                ? `**${highestPriority.toUpperCase()}** priority complaints need immediate attention, focusing on ${getCategoryDisplayName(mostComplainedCategory)}.`
                : 'No major urgency spikes detected recently.',
        },
        {
            title: '📊 Highest Volume Forecast',
            type: 'info',
            content: `**${getCategoryDisplayName(mostComplainedCategory)}** has the highest volume (${categories[0][1] || 0} cases). This high volume trend is predicted to continue for the next quarter.`,
        },
        trendInsight,
    ];
};
// --- END NEW: Logical AI Insight Function ---


// Mock AI report generation
export const generateSmartReport = (complaints: Complaint[]): string => {
  const totalComplaints = complaints.length;
  // Fallback if no complaints exist
  if (totalComplaints === 0) {
    return "Report Generation Failed: No live complaint data is available in the system to analyze. Please ensure users have submitted complaints or check your MongoDB connection.";
  }
  
  const mostCommonCategory = getMostCommonCategory(complaints);
  const avgSentiment = getAverageSentiment(complaints);
  const urgentCount = complaints.filter(c => c.priority === 'urgent').length;
  
  return `
📊 AI Generated Monthly Report

📈 Summary:
• Total complaints received: ${totalComplaints}
• Most common issue: ${getCategoryDisplayName(mostCommonCategory)}
• Overall sentiment: ${avgSentiment > 0 ? 'Positive' : avgSentiment < 0 ? 'Negative' : 'Neutral'}
• Urgent cases: ${urgentCount}

🔍 Key Insights:
• ${getCategoryDisplayName(mostCommonCategory)} services require immediate attention with the highest complaint volume.
• ${urgentCount > 10 ? 'High number of urgent cases suggests systemic issues requiring priority focus' : 'Manageable number of urgent cases'}
• Public sentiment is generally ${avgSentiment < -0.3 ? 'negative' : avgSentiment > 0.3 ? 'positive' : 'neutral'} with current services.

💡 Recommendations:
• Focus resources on improving ${getCategoryDisplayName(mostCommonCategory)} services.
• Implement proactive monitoring for urgent case categories.
• Consider public communication campaigns for transparency.
  `.trim();
};

const getMostCommonCategory = (complaints: Complaint[]): ServiceCategory => {
  const categoryCounts: Record<ServiceCategory, number> = {
    electricity: 0, water: 0, healthcare: 0, roads: 0, education: 0,
    'waste-management': 0, transportation: 0, other: 0
  };
  
  complaints.forEach(complaint => {
    categoryCounts[complaint.category]++;
  });
  
  // Safely find the highest count or default to 'other'
  const maxCategory = Object.entries(categoryCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
  return maxCategory[0] as ServiceCategory || 'other';
};

const getAverageSentiment = (complaints: Complaint[]): number => {
  const sentimentScores = complaints.map(c => 
    c.sentiment === 'positive' ? 1 : c.sentiment === 'negative' ? -1 : 0
  );
  // Correctly type the reducer to handle number and number
  return (complaints.length > 0) ? (sentimentScores.reduce((a: number, b: number) => a + b, 0) / complaints.length) : 0;
};

const getCategoryDisplayName = (category: ServiceCategory): string => {
  const displayNames: Record<ServiceCategory, string> = {
    electricity: 'Electricity',
    water: 'Water Supply',
    healthcare: 'Healthcare',
    roads: 'Roads & Infrastructure',
    education: 'Education',
    'waste-management': 'Waste Management',
    transportation: 'Transportation',
    other: 'Other Services'
  };
  return displayNames[category];
};