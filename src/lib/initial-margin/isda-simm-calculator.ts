import { AssetClass, MarginType } from '../saccr/types';
import { ISDASIMMFormInput, ISDASIMMResult, ISDASIMMTradeData, RiskFactorType } from './types';

// Risk weights for ISDA SIMM v2.6
const RISK_WEIGHTS: Record<RiskFactorType, Record<string, number>> = {
  [RiskFactorType.INTEREST_RATE]: {
    '1': 0.0160, // Regular vol bucket
    '2': 0.0090, // Low vol bucket
    '3': 0.0140, // High vol bucket
  },
  [RiskFactorType.CREDIT_QUALIFYING]: {
    '1': 0.0038, // Investment grade (1-3Y)
    '2': 0.0042, // Investment grade (3-7Y)
    '3': 0.0046, // Investment grade (7Y+)
    '4': 0.0060, // High yield (1-3Y)
    '5': 0.0070, // High yield (3-7Y)
    '6': 0.0080, // High yield (7Y+)
    '7': 0.0200, // Emerging markets
  },
  [RiskFactorType.CREDIT_NON_QUALIFYING]: {
    '1': 0.0080, // Investment grade
    '2': 0.0120, // High yield
  },
  [RiskFactorType.EQUITY]: {
    '1': 0.2800, // Large cap developed markets
    '2': 0.3200, // Small cap developed markets
    '3': 0.3000, // Large cap emerging markets
    '4': 0.3500, // Small cap emerging markets
  },
  [RiskFactorType.COMMODITY]: {
    '1': 0.1800, // Energy
    '2': 0.1400, // Metals
    '3': 0.1800, // Agricultural
    '4': 0.2000, // Other
  },
  [RiskFactorType.FX]: {
    '1': 0.0600, // Regular vol currency pairs
    '2': 0.0400, // Low vol currency pairs
    '3': 0.1000, // High vol currency pairs
  },
};

// Correlation parameters within risk factor types
const INTRA_FACTOR_CORRELATIONS: Record<RiskFactorType, number> = {
  [RiskFactorType.INTEREST_RATE]: 0.25,
  [RiskFactorType.CREDIT_QUALIFYING]: 0.35,
  [RiskFactorType.CREDIT_NON_QUALIFYING]: 0.35,
  [RiskFactorType.EQUITY]: 0.15,
  [RiskFactorType.COMMODITY]: 0.20,
  [RiskFactorType.FX]: 0.25,
};

// Correlation parameters between risk factor types
const INTER_FACTOR_CORRELATIONS: Record<RiskFactorType, Record<RiskFactorType, number>> = {
  [RiskFactorType.INTEREST_RATE]: {
    [RiskFactorType.INTEREST_RATE]: 1.00,
    [RiskFactorType.CREDIT_QUALIFYING]: 0.30,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 0.20,
    [RiskFactorType.EQUITY]: 0.10,
    [RiskFactorType.COMMODITY]: 0.15,
    [RiskFactorType.FX]: 0.40,
  },
  [RiskFactorType.CREDIT_QUALIFYING]: {
    [RiskFactorType.INTEREST_RATE]: 0.30,
    [RiskFactorType.CREDIT_QUALIFYING]: 1.00,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 0.75,
    [RiskFactorType.EQUITY]: 0.40,
    [RiskFactorType.COMMODITY]: 0.10,
    [RiskFactorType.FX]: 0.15,
  },
  [RiskFactorType.CREDIT_NON_QUALIFYING]: {
    [RiskFactorType.INTEREST_RATE]: 0.20,
    [RiskFactorType.CREDIT_QUALIFYING]: 0.75,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 1.00,
    [RiskFactorType.EQUITY]: 0.30,
    [RiskFactorType.COMMODITY]: 0.10,
    [RiskFactorType.FX]: 0.15,
  },
  [RiskFactorType.EQUITY]: {
    [RiskFactorType.INTEREST_RATE]: 0.10,
    [RiskFactorType.CREDIT_QUALIFYING]: 0.40,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 0.30,
    [RiskFactorType.EQUITY]: 1.00,
    [RiskFactorType.COMMODITY]: 0.20,
    [RiskFactorType.FX]: 0.15,
  },
  [RiskFactorType.COMMODITY]: {
    [RiskFactorType.INTEREST_RATE]: 0.15,
    [RiskFactorType.CREDIT_QUALIFYING]: 0.10,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 0.10,
    [RiskFactorType.EQUITY]: 0.20,
    [RiskFactorType.COMMODITY]: 1.00,
    [RiskFactorType.FX]: 0.15,
  },
  [RiskFactorType.FX]: {
    [RiskFactorType.INTEREST_RATE]: 0.40,
    [RiskFactorType.CREDIT_QUALIFYING]: 0.15,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 0.15,
    [RiskFactorType.EQUITY]: 0.15,
    [RiskFactorType.COMMODITY]: 0.15,
    [RiskFactorType.FX]: 1.00,
  },
};

/**
 * Calculate initial margin using the ISDA SIMM approach
 * @param formData Form input data
 * @returns ISDA SIMM calculation result
 */
export function calculateISDASIMM(formData: ISDASIMMFormInput): ISDASIMMResult {
  // Group risk factors by type
  const riskFactorsByType: Record<RiskFactorType, { bucket: number; value: number }[]> = {
    [RiskFactorType.INTEREST_RATE]: [],
    [RiskFactorType.CREDIT_QUALIFYING]: [],
    [RiskFactorType.CREDIT_NON_QUALIFYING]: [],
    [RiskFactorType.EQUITY]: [],
    [RiskFactorType.COMMODITY]: [],
    [RiskFactorType.FX]: [],
  };
  
  // Process each trade's risk factors
  formData.trades.forEach((trade) => {
    trade.riskFactors.forEach((factor) => {
      if (!riskFactorsByType[factor.type]) {
        riskFactorsByType[factor.type] = [];
      }
      
      // Add risk factor with sensitivity value
      riskFactorsByType[factor.type]!.push({
        bucket: factor.bucket,
        value: factor.value * Number(trade.sensitivityValue),
      });
    });
  });
  
  // Calculate margin for each risk factor type
  const riskFactorContributions: Record<string, number> = {
    [RiskFactorType.INTEREST_RATE]: 0,
    [RiskFactorType.CREDIT_QUALIFYING]: 0,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 0,
    [RiskFactorType.EQUITY]: 0,
    [RiskFactorType.COMMODITY]: 0,
    [RiskFactorType.FX]: 0,
  };
  const components: Record<string, number> = {
    [RiskFactorType.INTEREST_RATE]: 0,
    [RiskFactorType.CREDIT_QUALIFYING]: 0,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: 0,
    [RiskFactorType.EQUITY]: 0,
    [RiskFactorType.COMMODITY]: 0,
    [RiskFactorType.FX]: 0,
  };
  
  // Map risk factor types to asset classes for reporting
  const riskFactorToAssetClass: Record<RiskFactorType, AssetClass> = {
    [RiskFactorType.INTEREST_RATE]: AssetClass.INTEREST_RATE,
    [RiskFactorType.CREDIT_QUALIFYING]: AssetClass.CREDIT,
    [RiskFactorType.CREDIT_NON_QUALIFYING]: AssetClass.CREDIT,
    [RiskFactorType.EQUITY]: AssetClass.EQUITY,
    [RiskFactorType.COMMODITY]: AssetClass.COMMODITY,
    [RiskFactorType.FX]: AssetClass.FOREIGN_EXCHANGE,
  };
  
  // Calculate risk factor type contributions
  Object.entries(riskFactorsByType).forEach(([type, factors]) => {
    const riskType = type as RiskFactorType;
    
    // Group by bucket
    const bucketValues: Record<string, number> = {};
    factors.forEach((factor) => {
      if (!bucketValues[factor.bucket]) {
        bucketValues[factor.bucket] = 0;
      }
      bucketValues[factor.bucket] += factor.value;
    });
    
    // Calculate weighted sensitivities by bucket
    const weightedSensitivities: Record<number, number> = {};
    Object.entries(bucketValues).forEach(([bucket, value]) => {
      const bucketNum = parseInt(bucket);
      const riskWeight = RISK_WEIGHTS[riskType][bucketNum.toString()] || 0.01; // Default if not found
      weightedSensitivities[bucketNum] = Math.abs(value) * riskWeight;
    });
    
    // Calculate intra-bucket aggregation (sum of squares within each bucket)
    let intraBucketSum = 0;
    Object.values(weightedSensitivities).forEach((value) => {
      intraBucketSum += value * value;
    });
    
    // Calculate inter-bucket aggregation (correlation between buckets)
    let interBucketSum = 0;
    const buckets = Object.keys(weightedSensitivities).map(Number);
    
    for (let i = 0; i < buckets.length; i++) {
      for (let j = i + 1; j < buckets.length; j++) {
        const bucket1 = buckets[i];
        const bucket2 = buckets[j];
        const correlation = INTRA_FACTOR_CORRELATIONS[riskType];
        
        interBucketSum += correlation * weightedSensitivities[bucket1] * weightedSensitivities[bucket2];
      }
    }
    
    // Total contribution for this risk factor type
    const riskFactorContribution = Math.sqrt(intraBucketSum + 2 * interBucketSum);
    riskFactorContributions[riskType] = riskFactorContribution;
    
    // Map to asset class for reporting
    const assetClass = riskFactorToAssetClass[riskType];
    if (!components[assetClass]) {
      components[assetClass] = 0;
    }
    components[assetClass]! += riskFactorContribution;
  });
  
  // Calculate total initial margin with correlation across risk factor types
  let totalIM = 0;
  let sumOfSquares = 0;
  
  // Sum of squared risk factor contributions
  Object.entries(riskFactorContributions).forEach(([type1, value1]) => {
    sumOfSquares += value1 * value1;
    
    // Cross-terms with correlation
    Object.entries(riskFactorContributions).forEach(([type2, value2]) => {
      if (type1 !== type2) {
        const correlation = INTER_FACTOR_CORRELATIONS[type1 as RiskFactorType][type2 as RiskFactorType];
        totalIM += correlation * value1 * value2;
      }
    });
  });
  
  // Add sum of squares to cross-terms
  totalIM += sumOfSquares;
  totalIM = Math.sqrt(totalIM);
  
  // Calculate diversification benefit
  const sumOfContributions = Object.values(riskFactorContributions).reduce((sum, value) => sum + value, 0);
  const diversificationBenefit = sumOfContributions - totalIM;
  
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
    components,
    riskFactorContributions,
    diversificationBenefit,
    netInitialMargin,
    collateralValue,
  };
}

/**
 * Convert form input to ISDA SIMM input format
 * @param formData Form input data
 * @returns ISDA SIMM input data
 */
export function convertFormToISDASIMMInput(formData: Record<string, unknown>): ISDASIMMFormInput {
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
    riskFactors: (trade.riskFactors as Record<string, unknown>[]).map((factor) => ({
      type: factor.type as RiskFactorType,
      bucket: parseInt(String(factor.bucket)),
      label: factor.label as string,
      value: parseFloat(String(factor.value)),
    })),
    sensitivityValue: parseFloat(String(trade.sensitivityValue)),
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
 * Parse CSV data to ISDA SIMM input format
 * @param csvData CSV data
 * @returns ISDA SIMM input data
 */
export function parseCSVToISDASIMMInput(csvData: Record<string, unknown>[]): ISDASIMMTradeData[] {
  return csvData.map((row) => ({
    id: row.id as string || `trade-${Math.random().toString(36).substr(2, 9)}`,
    assetClass: row.assetClass as AssetClass,
    notionalAmount: parseFloat(String(row.notionalAmount)),
    currency: row.currency as string,
    maturityDate: row.maturityDate as string,
    startDate: row.startDate as string || new Date().toISOString().split('T')[0],
    riskFactors: JSON.parse(row.riskFactors as string || '[]').map((factor: Record<string, unknown>) => ({
      type: factor.type as RiskFactorType,
      bucket: parseInt(String(factor.bucket)),
      label: factor.label as string,
      value: parseFloat(String(factor.value)),
    })),
    sensitivityValue: parseFloat(String(row.sensitivityValue)),
  }));
}
