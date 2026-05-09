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
