import { BudgetStrategy, Platform } from "./types";

export function calcBudgetStrategy(budget: number, platforms: Platform[]): BudgetStrategy {
  const hasTikTok = platforms.includes("tiktok");
  const hasIG     = platforms.includes("instagram");
  const bestPlatform = hasTikTok ? "TikTok" : hasIG ? "Instagram" : platforms[0] ?? "Instagram";

  if (budget < 5000) {
    return {
      tier: "organic", tierLabel: "Organic Only",
      influencerCount: 0, costPerInfluencer: 0, boostBudget: 0,
      bestPlatform,
      reachMin: 500, reachMax: 3000,
      summary: "Your full budget goes into creating great organic content. Focus on posting consistently with strong captions and hashtags.",
    };
  }
  if (budget < 20000) {
    const costPer = 1500;
    const count   = Math.min(3, Math.floor((budget * 0.75) / costPer));
    return {
      tier: "nano", tierLabel: "Nano Influencers",
      influencerCount: count, costPerInfluencer: costPer,
      boostBudget: budget - count * costPer,
      bestPlatform,
      reachMin: 5000, reachMax: 25000,
      summary: `Work with ${count} nano influencers (1K–10K followers each) at ₹${costPer.toLocaleString()} per post. High engagement, authentic feel.`,
    };
  }
  if (budget < 100000) {
    const costPer = 5000;
    const count   = Math.min(4, Math.floor((budget * 0.75) / costPer));
    return {
      tier: "micro", tierLabel: "Micro Influencers",
      influencerCount: count, costPerInfluencer: costPer,
      boostBudget: budget - count * costPer,
      bestPlatform,
      reachMin: 30000, reachMax: 150000,
      summary: `Work with ${count} micro influencers (10K–100K followers each) at ₹${costPer.toLocaleString()} per post. Best ROI at this budget level.`,
    };
  }
  const costPer = 20000;
  const count   = Math.min(3, Math.floor((budget * 0.6) / costPer));
  return {
    tier: "mid", tierLabel: "Mid-tier Influencers",
    influencerCount: count, costPerInfluencer: costPer,
    boostBudget: budget - count * costPer,
    bestPlatform,
    reachMin: 200000, reachMax: 1000000,
    summary: `Work with ${count} mid-tier influencers (100K–500K followers each) at ₹${costPer.toLocaleString()} per post. Mass reach with strong credibility.`,
  };
}
