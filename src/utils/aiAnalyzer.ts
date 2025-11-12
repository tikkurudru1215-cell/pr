import { Complaint, ServiceCategory } from '../types';

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

// Mock AI report generation
export const generateSmartReport = (complaints: Complaint[]): string => {
  const totalComplaints = complaints.length;
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
• ${mostCommonCategory} services require immediate attention with the highest complaint volume
• ${urgentCount > 10 ? 'High number of urgent cases suggests systemic issues requiring priority focus' : 'Manageable number of urgent cases'}
• Public sentiment indicates ${avgSentiment < -0.3 ? 'significant dissatisfaction' : avgSentiment > 0.3 ? 'general satisfaction' : 'mixed feelings'} with current services

💡 Recommendations:
• Focus resources on improving ${getCategoryDisplayName(mostCommonCategory)} services
• Implement proactive monitoring for urgent case categories
• Consider public communication campaigns for transparency
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
  
  return Object.entries(categoryCounts).reduce((a, b) => categoryCounts[a[0] as ServiceCategory] > categoryCounts[b[0] as ServiceCategory] ? a : b)[0] as ServiceCategory;
};

const getAverageSentiment = (complaints: Complaint[]): number => {
  const sentimentScores = complaints.map(c => 
    c.sentiment === 'positive' ? 1 : c.sentiment === 'negative' ? -1 : 0
  );
  return sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
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