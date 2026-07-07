/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ExecutiveSummary {
  mission: string;
  vision: string;
  problemSolved: string;
  solution: string;
  keySuccessFactors: string[];
}

export interface MarketAnalysis {
  audienceProfile: string;
  competitorAnalysis: string;
  marketTrends: string;
  swotAnalysis: SWOTAnalysis;
}

export interface MarketingStrategy {
  positioning: string;
  pricingModel: string;
  marketingChannels: string[];
  salesTactic: string;
}

export interface OperationsPlan {
  keyOperations: string;
  technologyRequirements: string[];
  personnelNeeds: string;
}

export interface FinancialOutlook {
  revenueStreams: string[];
  costStructure: string[];
  breakEvenAnalysis: string;
  fundingGoal: string;
}

export interface BusinessPlan {
  id: string;
  createdAt: string;
  businessName: string;
  niche: string;
  targetAudience: string;
  objectives: string;
  location: string;
  stage: string;
  timeline: string;
  executiveSummary: ExecutiveSummary;
  marketAnalysis: MarketAnalysis;
  marketingStrategy: MarketingStrategy;
  operationsPlan: OperationsPlan;
  financialOutlook: FinancialOutlook;
}

export interface DemoTemplate {
  label: string;
  businessName: string;
  niche: string;
  targetAudience: string;
  objectives: string;
  location: string;
  stage: string;
  timeline: string;
}
