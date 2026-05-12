export interface UserOrder {
  id: string;
  planId: string;
  planName: string;
  price: number;
  status: 'pending' | 'paid' | 'active' | 'completed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: number;
  // Business details
  businessName: string;
  businessCategory: string;
  productDescription: string;
  targetAudience: string;
  goal: string;
  budget: number;
  platforms: string[];
  duration?: number;
  promotionEfficiency: 'conservative' | 'balanced' | 'aggressive';
  videoUrl?: string;
  websiteUrl?: string;
  contactEmail: string;
}

export interface DayMetric {
  day: number;
  date: string;
  projected: {
    reach: number;
    clicks: number;
    impressions: number;
    conversions: number;
  };
  actual?: {
    reach: number;
    clicks: number;
    impressions: number;
    conversions: number;
  };
}

export interface Campaign {
  id: string;
  orderId: string;
  strategy: string;
  contentCalendar: string;
  adPackages: string;
  metrics: DayMetric[];
  createdAt: number;
  updatedAt: number;
}

export interface FormData {
  product?: string;
  productName: string;
  category: string;
  goal: string;
  budget: string;
  targetAudience: string;
  platforms: string[];
  duration: string;
}

export const CATEGORIES = [
  { value: 'Food & Beverage',          label: 'Food & Beverage',          emoji: '🍔' },
  { value: 'Fashion & Clothing',       label: 'Fashion & Clothing',       emoji: '👗' },
  { value: 'Tech Startup',             label: 'Tech Startup',             emoji: '💻' },
  { value: 'Events & Hackathons',      label: 'Events & Hackathons',      emoji: '🎪' },
  { value: 'Real Estate',             label: 'Real Estate',              emoji: '🏠' },
  { value: 'Education & Courses',      label: 'Education & Courses',      emoji: '📚' },
  { value: 'Healthcare & Wellness',    label: 'Healthcare & Wellness',    emoji: '🏥' },
  { value: 'Gold & Jewellery',         label: 'Gold & Jewellery',         emoji: '💍' },
  { value: 'Grocery & FMCG',           label: 'Grocery & FMCG',           emoji: '🛒' },
  { value: 'Beauty & Makeup',          label: 'Beauty & Makeup',          emoji: '💄' },
  { value: 'B2B Services',             label: 'B2B Services',             emoji: '🤝' },
  { value: 'Local Business',           label: 'Local Business',           emoji: '🏪' },
  { value: 'Fitness & Gym',            label: 'Fitness & Gym',            emoji: '💪' },
  { value: 'Travel & Tourism',         label: 'Travel & Tourism',         emoji: '✈️' },
  { value: 'Entertainment',            label: 'Entertainment',            emoji: '🎬' },
  { value: 'Other',                    label: 'Other',                    emoji: '✨' },
];

export const GOALS = [
  { value: 'Brand Awareness',           label: 'Brand Awareness' },
  { value: 'Drive Sales / Conversions', label: 'Drive Sales / Conversions' },
  { value: 'Generate Leads',            label: 'Generate Leads' },
  { value: 'Grow Followers',            label: 'Grow Followers' },
  { value: 'Promote Event',             label: 'Promote Event' },
  { value: 'Launch New Product',        label: 'Launch New Product' },
  { value: 'Re-engagement',             label: 'Re-engagement' },
];
