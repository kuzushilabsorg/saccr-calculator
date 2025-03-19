import { AssetClass, MarginType } from '../saccr/types';
import { GridScheduleFormInput, GridScheduleResult, GridScheduleTradeData, MaturityBucket, RiskFactorType } from './types';

// Risk weights for Grid/Schedule approach as per BCBS-IOSCO framework
const RISK_WEIGHTS = {
  [AssetClass.INTEREST_RATE]: {
    [MaturityBucket.LESS_THAN_ONE_YEAR]: 0.02,
    [MaturityBucket.ONE_TO_FIVE_YEARS]: 0.05,
    [MaturityBucket.GREATER_THAN_FIVE_YEARS]: 0.15,
  },
  [AssetClass.CREDIT]: {
    [MaturityBucket.LESS_THAN_ONE_YEAR]: 0.05,
    [MaturityBucket.ONE_TO_FIVE_YEARS]: 0.08,
    [MaturityBucket.GREATER_THAN_FIVE_YEARS]: 0.15,
  },
  [AssetClass.EQUITY]: {
    [MaturityBucket.LESS_THAN_ONE_YEAR]: 0.15,
    [MaturityBucket.ONE_TO_FIVE_YEARS]: 0.15,
    [MaturityBucket.GREATER_THAN_FIVE_YEARS]: 0.15,
  },
  [AssetClass.COMMODITY]: {
    [MaturityBucket.LESS_THAN_ONE_YEAR]: 0.15,
    [MaturityBucket.ONE_TO_FIVE_YEARS]: 0.15,
    [MaturityBucket.GREATER_THAN_FIVE_YEARS]: 0.15,
  },
  [AssetClass.FOREIGN_EXCHANGE]: {
    [MaturityBucket.LESS_THAN_ONE_YEAR]: 0.06,
    [MaturityBucket.ONE_TO_FIVE_YEARS]: 0.08,
    [MaturityBucket.GREATER_THAN_FIVE_YEARS]: 0.10,
  },
};

// Correlation parameters for RiskFactorType
const RISK_FACTOR_CORRELATION = {
  [RiskFactorType.INTEREST_RATE]: {
    [RiskFactorType.INTEREST_RATE]: 1.0,
    [RiskFactorType.CREDIT_QUALIFYING]: 0.5,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 0.5,
    [RiskFactorType.EQUITY]: 0.3,
    [RiskFactorType.COMMODITY]: 0.2,
    [RiskFactorType.FX]: 0.4,
  },
  [RiskFactorType.CREDIT_QUALIFYING]: {
    [RiskFactorType.INTEREST_RATE]: 0.5,
    [RiskFactorType.CREDIT_QUALIFYING]: 1.0,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 0.9,
    [RiskFactorType.EQUITY]: 0.5,
    [RiskFactorType.COMMODITY]: 0.2,
    [RiskFactorType.FX]: 0.3,
  },
  [RiskFactorType.CREDIT_NON_QUALIFYING]: {
    [RiskFactorType.INTEREST_RATE]: 0.5,
    [RiskFactorType.CREDIT_QUALIFYING]: 0.9,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 1.0,
    [RiskFactorType.EQUITY]: 0.5,
    [RiskFactorType.COMMODITY]: 0.2,
    [RiskFactorType.FX]: 0.3,
  },
  [RiskFactorType.EQUITY]: {
    [RiskFactorType.INTEREST_RATE]: 0.3,
    [RiskFactorType.CREDIT_QUALIFYING]: 0.5,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 0.5,
    [RiskFactorType.EQUITY]: 1.0,
    [RiskFactorType.COMMODITY]: 0.3,
    [RiskFactorType.FX]: 0.2,
  },
  [RiskFactorType.COMMODITY]: {
    [RiskFactorType.INTEREST_RATE]: 0.2,
    [RiskFactorType.CREDIT_QUALIFYING]: 0.2,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 0.2,
    [RiskFactorType.EQUITY]: 0.3,
    [RiskFactorType.COMMODITY]: 1.0,
    [RiskFactorType.FX]: 0.2,
  },
  [RiskFactorType.FX]: {
    [RiskFactorType.INTEREST_RATE]: 0.4,
    [RiskFactorType.CREDIT_QUALIFYING]: 0.3,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 0.3,
    [RiskFactorType.EQUITY]: 0.2,
    [RiskFactorType.COMMODITY]: 0.2,
    [RiskFactorType.FX]: 1.0,
  },
};

/**
 * Calculate initial margin using the Grid/Schedule approach
 * @param formData Form input data
 * @returns Grid/Schedule calculation result
 */
export function calculateGridScheduleIM(formData: GridScheduleFormInput): GridScheduleResult {
  // Group trades by asset class and maturity bucket
  const grossNotionalByAssetClass: GridScheduleResult['grossNotionalByAssetClass'] = {};
  
  // Initialize components for each asset class
  const components: { [key in AssetClass]?: number } = {};
  
  // Process each trade
  formData.trades.forEach((trade) => {
    const { assetClass, maturityBucket, notionalAmount } = trade;
    
    // Initialize asset class if not exists
    if (!grossNotionalByAssetClass[assetClass]) {
      grossNotionalByAssetClass[assetClass] = {};
    }
    
    // Initialize maturity bucket if not exists
    if (!grossNotionalByAssetClass[assetClass]![maturityBucket]) {
      grossNotionalByAssetClass[assetClass]![maturityBucket] = 0;
    }
    
    // Add notional amount to the appropriate bucket
    grossNotionalByAssetClass[assetClass]![maturityBucket]! += Number(notionalAmount);
  });
  
  // Calculate initial margin for each asset class
  Object.entries(grossNotionalByAssetClass).forEach(([assetClass, maturityBuckets]) => {
    const assetClassEnum = assetClass as AssetClass;
    let assetClassIM = 0;
    
    // Calculate IM for each maturity bucket
    Object.entries(maturityBuckets).forEach(([bucket, notional]) => {
      const maturityBucket = bucket as MaturityBucket;
      const riskWeight = RISK_WEIGHTS[assetClassEnum][maturityBucket];
      
      // Add to asset class IM
      assetClassIM += notional * riskWeight;
    });
    
    // Store asset class IM
    components[assetClassEnum] = assetClassIM;
  });
  
  // Map AssetClass to RiskFactorType for components
  const componentsMap: { [key in RiskFactorType]?: number } = {};
  
  // Map AssetClass to RiskFactorType
  const assetClassToRiskFactorType: { [key in AssetClass]: RiskFactorType } = {
    [AssetClass.INTEREST_RATE]: RiskFactorType.INTEREST_RATE,
    [AssetClass.CREDIT]: RiskFactorType.CREDIT_QUALIFYING, // Default to qualifying
    [AssetClass.EQUITY]: RiskFactorType.EQUITY,
    [AssetClass.COMMODITY]: RiskFactorType.COMMODITY,
    [AssetClass.FOREIGN_EXCHANGE]: RiskFactorType.FX,
  };

  // Convert components from AssetClass to RiskFactorType
  Object.entries(components).forEach(([assetClass, value]) => {
    const riskFactorType = assetClassToRiskFactorType[assetClass as AssetClass];
    if (riskFactorType) {
      componentsMap[riskFactorType] = value;
    }
  });
  
  // Calculate total initial margin with correlation across asset classes
  let totalIM = 0;
  
  // Sum of squared asset class IMs
  Object.entries(componentsMap).forEach(([riskType1, im1]) => {
    Object.entries(componentsMap).forEach(([riskType2, im2]) => {
      const correlation = RISK_FACTOR_CORRELATION[riskType1 as RiskFactorType][riskType2 as RiskFactorType];
      totalIM += correlation * im1 * im2;
    });
  });
  
  totalIM = Math.sqrt(totalIM);
  
  // Calculate collateral value
  let collateralValue = 0;
  if (formData.collateral) {
    formData.collateral.forEach((collateral) => {
      const haircut = collateral.haircut ? Number(collateral.haircut) : 0;
      collateralValue += Number(collateral.collateralAmount) * (1 - haircut / 100);
    });
  }
  
  // Apply threshold and minimum transfer amount
  const thresholdAmount = formData.nettingSet.thresholdAmount ? Number(formData.nettingSet.thresholdAmount) : 0;
  const minimumTransferAmount = formData.nettingSet.minimumTransferAmount ? Number(formData.nettingSet.minimumTransferAmount) : 0;
  
  let netInitialMargin = Math.max(0, totalIM - thresholdAmount);
  
  // Apply minimum transfer amount
  if (netInitialMargin > 0 && netInitialMargin < minimumTransferAmount) {
    netInitialMargin = 0;
  }
  
  return {
    initialMargin: totalIM,
    components: componentsMap,
    grossNotionalByAssetClass,
    netInitialMargin,
    collateralValue,
  };
}

/**
 * Convert form input to Grid/Schedule input format
 * @param formData Form input data
 * @returns Grid/Schedule input data
 */
export function convertFormToGridScheduleInput(formData: Record<string, unknown>): GridScheduleFormInput {
  // Extract netting set information
  const nettingSet = {
    nettingAgreementId: (formData.nettingSet as Record<string, unknown>).nettingAgreementId as string,
    marginType: (formData.nettingSet as Record<string, unknown>).marginType as MarginType,
    thresholdAmount: (formData.nettingSet as Record<string, unknown>).thresholdAmount ? parseFloat(String((formData.nettingSet as Record<string, unknown>).thresholdAmount)) : undefined,
    minimumTransferAmount: (formData.nettingSet as Record<string, unknown>).minimumTransferAmount ? parseFloat(String((formData.nettingSet as Record<string, unknown>).minimumTransferAmount)) : undefined,
  };
  
  // Extract trades
  const trades = (formData.trades as Record<string, unknown>[]).map((trade) => ({
    id: trade.id as string || `trade-${Math.random().toString(36).substr(2, 9)}`,
    assetClass: trade.assetClass as AssetClass,
    notionalAmount: parseFloat(String(trade.notionalAmount)),
    currency: trade.currency as string,
    maturityDate: trade.maturityDate as string,
    startDate: trade.startDate as string || new Date().toISOString().split('T')[0],
    maturityBucket: trade.maturityBucket as MaturityBucket,
  }));
  
  // Extract collateral
  const collateral = (formData.collateral as Record<string, unknown>[] | undefined)?.map((coll) => ({
    collateralAmount: parseFloat(String(coll.collateralAmount)),
    collateralCurrency: coll.collateralCurrency as string,
    haircut: coll.haircut ? parseFloat(String(coll.haircut)) : 0,
  }));
  
  return {
    nettingSet,
    trades,
    collateral,
  };
}

/**
 * Parse CSV data to Grid/Schedule input format
 * @param csvData CSV data
 * @returns Grid/Schedule input data
 */
export function parseCSVToGridScheduleInput(csvData: Record<string, unknown>[]): GridScheduleTradeData[] {
  return csvData.map((row) => ({
    id: row.id as string || `trade-${Math.random().toString(36).substr(2, 9)}`,
    assetClass: row.assetClass as AssetClass,
    notionalAmount: parseFloat(String(row.notionalAmount)),
    currency: row.currency as string,
    maturityDate: row.maturityDate as string,
    startDate: row.startDate as string || new Date().toISOString().split('T')[0],
    maturityBucket: row.maturityBucket as MaturityBucket,
  }));
}
