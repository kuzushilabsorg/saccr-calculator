import { AssetClass, MarginType, PositionType, TransactionType } from '../saccr/types';

/**
 * Types for Potential Future Exposure (PFE) Calculator based on SA-CCR framework
 */

// Time horizon for PFE calculation
export enum PFETimeHorizon {
  ONE_WEEK = '1_week',
  TWO_WEEKS = '2_weeks',
  ONE_MONTH = '1_month',
  THREE_MONTHS = '3_months',
  SIX_MONTHS = '6_months',
  ONE_YEAR = '1_year',
}

// Confidence level for PFE calculation
export enum PFEConfidenceLevel {
  NINETY_FIVE_PERCENT = '95%',
  NINETY_SEVEN_POINT_FIVE_PERCENT = '97.5%',
  NINETY_NINE_PERCENT = '99%',
}

// PFE Calculation Method
export enum PFECalculationMethod {
  REGULATORY_STANDARDISED_APPROACH = 'regulatory_standardised_approach',
  MONTE_CARLO_SIMULATION = 'monte_carlo_simulation',
  INTERNAL_MODEL_METHOD = 'internal_model_method',
  HISTORICAL_SIMULATION_METHOD = 'historical_simulation_method',
}

// PFE Netting Set Information
export interface PFENettingSetInfo {
  nettingAgreementId: string;
  marginType: MarginType;
  thresholdAmount?: number;
  minimumTransferAmount?: number;
  marginPeriodOfRisk?: number;
  timeHorizon: PFETimeHorizon;
  confidenceLevel: PFEConfidenceLevel;
  calculationMethod: PFECalculationMethod;
}

// PFE Trade Data
export interface PFETradeData {
  id: string;
  assetClass: AssetClass;
  transactionType: TransactionType;
  positionType: PositionType;
  notionalAmount: number;
  currency: string;
  maturityDate: string; // ISO date string
  startDate: string; // ISO date string
  currentMarketValue: number;
  volatility?: number;
  stressScenario?: string;
}

// PFE Collateral Information
export interface PFECollateralInfo {
  collateralAmount: number;
  collateralCurrency: string;
  haircut?: number;
  stressedHaircut?: number;
}

// Complete PFE Input
export interface PFEInput {
  trades: PFETradeData[];
  nettingSet: PFENettingSetInfo;
  collateral?: PFECollateralInfo[];
}

// PFE Calculation Results
export interface PFEResult {
  potentialFutureExposure: number;
  expectedExposure: number;
  peakExposure: number;
  exposureProfile: {
    [timePoint: string]: number;
  };
  stressedPFE?: number;
  assetClassBreakdown: {
    [key in AssetClass]?: number;
  };
  timestamp: string;
  inputSummary: {
    nettingSetId: string;
    tradeCount: number;
    assetClasses: AssetClass[];
    marginType: MarginType;
    totalNotional: number;
    timeHorizon: PFETimeHorizon;
    confidenceLevel: PFEConfidenceLevel;
    calculationMethod: PFECalculationMethod;
  };
}

// Form Input Schema
export interface PFEFormInput {
  nettingSet: {
    nettingAgreementId: string;
    marginType: MarginType;
    thresholdAmount?: string | number;
    minimumTransferAmount?: string | number;
    marginPeriodOfRisk?: string | number;
    timeHorizon: PFETimeHorizon;
    confidenceLevel: PFEConfidenceLevel;
    calculationMethod: PFECalculationMethod;
  };
  trades: {
    id: string;
    assetClass: AssetClass;
    transactionType: TransactionType;
    positionType: PositionType;
    notionalAmount: string | number;
    currency: string;
    maturityDate: string;
    startDate: string;
    currentMarketValue: string | number;
    volatility?: string | number;
    stressScenario?: string;
  }[];
  collateral?: {
    collateralAmount: string | number;
    collateralCurrency: string;
    haircut?: string | number;
    stressedHaircut?: string | number;
  }[];
}
