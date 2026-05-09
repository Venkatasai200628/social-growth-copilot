export interface Plan {
  id: string;
  name: string;
  price: number;
  duration: number;
  platforms: string[];
  features: string[];
  highlight: string;
  badge?: string;
  color: string;
  accentColor: string;
  postLimit: number; // 0=none, -1=unlimited, N=monthly limit
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 999,
    duration: 7,
    platforms: ['Instagram', 'Facebook'],
    features: [
      '7-day AI campaign plan',
      '2 platforms covered',
      'Full content calendar (captions + hashtags)',
      'Virality score for every post',
      'Budget allocation strategy',
      'Day-by-day promotion tracker',
      'Email support',
    ],
    highlight: 'Perfect for small businesses & solo creators',
    color: '#22d3ee',
    accentColor: 'rgba(34,211,238,0.12)',
    postLimit: 0,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 2999,
    duration: 14,
    platforms: ['Instagram', 'Facebook', 'Twitter/X', 'LinkedIn'],
    features: [
      '14-day AI campaign plan',
      '4 platforms covered',
      'Full content calendar + scheduling guide',
      'Virality scoring + AI rewrite suggestions',
      'Auto-reply templates for DMs & comments',
      'Influencer outreach scripts',
      'ROI tracker + growth chart',
      'Priority support',
    ],
    highlight: 'Best for growing brands & startups',
    badge: 'Most Popular',
    color: '#7c3aed',
    accentColor: 'rgba(124,58,237,0.12)',
    postLimit: 15,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 7999,
    duration: 30,
    platforms: ['Instagram', 'Facebook', 'Twitter/X', 'LinkedIn', 'YouTube', 'WhatsApp'],
    features: [
      '30-day AI campaign plan',
      'All 6 platforms covered',
      'Daily AI coaching & content refresh',
      'Paid ads strategy (Facebook + Google Ads)',
      'Full creative brief for video ads',
      'Competitor analysis prompts',
      'Weekly performance review by AI',
      'ROI dashboard + conversion tracking',
      'Dedicated support',
    ],
    highlight: 'For serious businesses ready to scale',
    badge: 'Best Value',
    color: '#f59e0b',
    accentColor: 'rgba(245,158,11,0.12)',
    postLimit: -1,
  },
];
