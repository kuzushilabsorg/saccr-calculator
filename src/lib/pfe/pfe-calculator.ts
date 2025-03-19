import {
  PFEInput,
  PFEResult,
  PFETradeData,
  PFETimeHorizon,
  PFEConfidenceLevel,
  PFECalculationMethod,
} from './types';
import { AssetClass, MarginType } from '../saccr/types';

/**
 * Calculator for Potential Future Exposure (PFE) based on the SA-CCR framework
 * 
 * This class implements the calculation of PFE for derivative portfolios
 * following the Basel Committee on Banking Supervision's SA-CCR methodology.
 */
export class PFECalculator {
  /**
   * Calculate Potential Future Exposure (PFE) for a portfolio of trades
   * 
   * @param input The PFE calculation input
   * @returns The PFE calculation result
   */
  public static calculatePFE(input: PFEInput): PFEResult {
    // Extract input parameters
    const { trades, nettingSet } = input;
    
    // Calculate total notional and identify asset classes
    const totalNotional = trades.reduce((sum, trade) => sum + trade.notionalAmount, 0);
    const assetClasses = Array.from(new Set(trades.map(trade => trade.assetClass)));
    
    // Calculate PFE based on calculation method
    let potentialFutureExposure = 0;
    let expectedExposure = 0;
    let peakExposure = 0;
    let stressedPFE: number | undefined = undefined;
    
    // Initialize asset class breakdown
    const assetClassBreakdown: Record<string, number> = {};
    assetClasses.forEach(assetClass => {
      assetClassBreakdown[assetClass] = 0;
    });
    
    // Calculate PFE based on calculation method
    switch (nettingSet.calculationMethod) {
      case PFECalculationMethod.REGULATORY_SA_CCR:
        // Implement SA-CCR methodology
        ({ potentialFutureExposure, expectedExposure, peakExposure, stressedPFE } = 
          this.calculatePFEUsingSACCR(trades, nettingSet, assetClassBreakdown));
        break;
      
      case PFECalculationMethod.INTERNAL_MODEL:
        // Implement internal model methodology
        ({ potentialFutureExposure, expectedExposure, peakExposure, stressedPFE } = 
          this.calculatePFEUsingInternalModel(trades, nettingSet, assetClassBreakdown));
        break;
      
      case PFECalculationMethod.HISTORICAL_SIMULATION:
        // Implement historical simulation methodology
        ({ potentialFutureExposure, expectedExposure, peakExposure, stressedPFE } = 
          this.calculatePFEUsingHistoricalSimulation(trades, nettingSet, assetClassBreakdown));
        break;
      
      default:
        // Default to SA-CCR
        ({ potentialFutureExposure, expectedExposure, peakExposure, stressedPFE } = 
          this.calculatePFEUsingSACCR(trades, nettingSet, assetClassBreakdown));
    }
    
    // Generate exposure profile over time
    const exposureProfile = this.generateExposureProfile(trades, nettingSet);
    
    // Return result
    return {
      potentialFutureExposure,
      expectedExposure,
      peakExposure,
      stressedPFE,
      exposureProfile,
      assetClassBreakdown,
      timestamp: new Date().toISOString(),
      inputSummary: {
        nettingSetId: nettingSet.nettingAgreementId,
        tradeCount: trades.length,
        totalNotional,
        assetClasses,
        timeHorizon: nettingSet.timeHorizon,
        confidenceLevel: nettingSet.confidenceLevel,
        calculationMethod: nettingSet.calculationMethod,
        marginType: nettingSet.marginType,
      },
    };
  }
  
  /**
   * Calculate PFE using the SA-CCR methodology
   * 
   * @param trades The trades to calculate PFE for
   * @param nettingSet The netting set information
   * @param assetClassBreakdown Record to store PFE contribution by asset class
   * @returns The PFE calculation components
   */
  private static calculatePFEUsingSACCR(
    trades: PFETradeData[],
    nettingSet: PFEInput['nettingSet'],
    assetClassBreakdown: Record<string, number>
  ): {
    potentialFutureExposure: number;
    expectedExposure: number;
    peakExposure: number;
    stressedPFE?: number;
  } {
    // Group trades by asset class
    const tradesByAssetClass: Record<string, PFETradeData[]> = {};
    trades.forEach(trade => {
      if (!tradesByAssetClass[trade.assetClass]) {
        tradesByAssetClass[trade.assetClass] = [];
      }
      tradesByAssetClass[trade.assetClass].push(trade);
    });
    
    // Calculate PFE for each asset class
    let totalPFE = 0;
    let totalEE = 0;
    let maxPFE = 0;
    
    Object.entries(tradesByAssetClass).forEach(([assetClass, assetClassTrades]) => {
      // Calculate add-on for each asset class
      const assetClassAddOn = this.calculateAddOn(assetClassTrades);
      
      // Calculate PFE contribution for this asset class
      const pfeFactor = this.getPFEFactor(assetClass as AssetClass, nettingSet.timeHorizon, nettingSet.confidenceLevel);
      const assetClassPFE = assetClassAddOn * pfeFactor;
      
      // Store in breakdown
      assetClassBreakdown[assetClass] = assetClassPFE;
      
      // Add to total
      totalPFE += assetClassPFE;
      
      // Calculate expected exposure (typically lower than PFE)
      const assetClassEE = assetClassPFE * 0.7; // Simplified approach
      totalEE += assetClassEE;
      
      // Track maximum PFE for peak exposure
      if (assetClassPFE > maxPFE) {
        maxPFE = assetClassPFE;
      }
    });
    
    // Apply netting set adjustments
    if (nettingSet.marginType === MarginType.MARGINED) {
      // Apply margin period of risk adjustment
      const mporFactor = Math.sqrt(nettingSet.marginPeriodOfRisk || 10) / Math.sqrt(10);
      totalPFE *= mporFactor;
      totalEE *= mporFactor;
      maxPFE *= mporFactor;
    }
    
    // Calculate stressed PFE (typically 2-3x normal PFE)
    const stressedPFE = totalPFE * 2.5;
    
    return {
      potentialFutureExposure: totalPFE,
      expectedExposure: totalEE,
      peakExposure: maxPFE,
      stressedPFE,
    };
  }
  
  /**
   * Calculate PFE using an internal model methodology
   * 
   * @param trades The trades to calculate PFE for
   * @param nettingSet The netting set information
   * @param assetClassBreakdown Record to store PFE contribution by asset class
   * @returns The PFE calculation components
   */
  private static calculatePFEUsingInternalModel(
    trades: PFETradeData[],
    nettingSet: PFEInput['nettingSet'],
    assetClassBreakdown: Record<string, number>
  ): {
    potentialFutureExposure: number;
    expectedExposure: number;
    peakExposure: number;
    stressedPFE?: number;
  } {
    // Implementation of internal model methodology
    // This is a simplified version for demonstration
    
    // Group trades by asset class
    const tradesByAssetClass: Record<string, PFETradeData[]> = {};
    trades.forEach(trade => {
      if (!tradesByAssetClass[trade.assetClass]) {
        tradesByAssetClass[trade.assetClass] = [];
      }
      tradesByAssetClass[trade.assetClass].push(trade);
    });
    
    // Calculate PFE for each asset class using internal model
    let totalPFE = 0;
    let totalEE = 0;
    let maxPFE = 0;
    
    Object.entries(tradesByAssetClass).forEach(([assetClass, assetClassTrades]) => {
      // Calculate PFE contribution for this asset class using internal model
      const volatility = this.getAssetClassVolatility(assetClass as AssetClass);
      const timeHorizonFactor = this.getTimeHorizonFactor(nettingSet.timeHorizon);
      const confidenceFactor = this.getConfidenceFactor(nettingSet.confidenceLevel);
      
      // Internal model calculation (simplified)
      const assetClassPFE = assetClassTrades.reduce((sum, trade) => sum + trade.notionalAmount, 0) * 
        volatility * timeHorizonFactor * confidenceFactor;
      
      // Store in breakdown
      assetClassBreakdown[assetClass] = assetClassPFE;
      
      // Add to total
      totalPFE += assetClassPFE;
      
      // Calculate expected exposure
      const assetClassEE = assetClassPFE * 0.65; // Simplified approach for internal model
      totalEE += assetClassEE;
      
      // Track maximum PFE for peak exposure
      if (assetClassPFE > maxPFE) {
        maxPFE = assetClassPFE;
      }
    });
    
    // Calculate stressed PFE
    const stressedPFE = totalPFE * 3.0; // Higher stress factor for internal model
    
    return {
      potentialFutureExposure: totalPFE,
      expectedExposure: totalEE,
      peakExposure: maxPFE,
      stressedPFE,
    };
  }
  
  /**
   * Calculate PFE using historical simulation methodology
   * 
   * @param trades The trades to calculate PFE for
   * @param nettingSet The netting set information
   * @param assetClassBreakdown Record to store PFE contribution by asset class
   * @returns The PFE calculation components
   */
  private static calculatePFEUsingHistoricalSimulation(
    trades: PFETradeData[],
    nettingSet: PFEInput['nettingSet'],
    assetClassBreakdown: Record<string, number>
  ): {
    potentialFutureExposure: number;
    expectedExposure: number;
    peakExposure: number;
    stressedPFE?: number;
  } {
    // Implementation of historical simulation methodology
    // This is a simplified version for demonstration
    
    // Group trades by asset class
    const tradesByAssetClass: Record<string, PFETradeData[]> = {};
    trades.forEach(trade => {
      if (!tradesByAssetClass[trade.assetClass]) {
        tradesByAssetClass[trade.assetClass] = [];
      }
      tradesByAssetClass[trade.assetClass].push(trade);
    });
    
    // Calculate PFE for each asset class using historical simulation
    let totalPFE = 0;
    let totalEE = 0;
    let maxPFE = 0;
    
    Object.entries(tradesByAssetClass).forEach(([assetClass, assetClassTrades]) => {
      // Calculate PFE contribution for this asset class using historical data
      const historicalVolatility = this.getHistoricalVolatility(assetClass as AssetClass);
      const timeHorizonFactor = this.getTimeHorizonFactor(nettingSet.timeHorizon);
      const confidenceFactor = this.getConfidenceFactor(nettingSet.confidenceLevel);
      
      // Historical simulation calculation (simplified)
      const assetClassPFE = assetClassTrades.reduce((sum, trade) => sum + trade.notionalAmount, 0) * 
        historicalVolatility * timeHorizonFactor * confidenceFactor * 1.2; // Historical factor
      
      // Store in breakdown
      assetClassBreakdown[assetClass] = assetClassPFE;
      
      // Add to total
      totalPFE += assetClassPFE;
      
      // Calculate expected exposure
      const assetClassEE = assetClassPFE * 0.6; // Simplified approach for historical simulation
      totalEE += assetClassEE;
      
      // Track maximum PFE for peak exposure
      if (assetClassPFE > maxPFE) {
        maxPFE = assetClassPFE;
      }
    });
    
    // Calculate stressed PFE
    const stressedPFE = totalPFE * 2.2; // Stress factor based on historical worst-case
    
    return {
      potentialFutureExposure: totalPFE,
      expectedExposure: totalEE,
      peakExposure: maxPFE,
      stressedPFE,
    };
  }
  
  /**
   * Generate exposure profile over time
   * 
   * @param trades The trades to generate profile for
   * @param nettingSet The netting set information
   * @returns The exposure profile
   */
  private static generateExposureProfile(
    trades: PFETradeData[],
    nettingSet: PFEInput['nettingSet']
  ): Record<string, number> {
    const profile: Record<string, number> = {};
    const end = this.getTimeHorizonInDays(nettingSet.timeHorizon);
    
    // Generate profile points
    const numPoints = 10; // Number of points in the profile
    const interval = end / numPoints;
    
    for (let i = 0; i <= numPoints; i++) {
      const days = Math.round(i * interval);
      const date = this.addDaysToToday(days);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate exposure at this point (simplified)
      const exposureFactor = this.getExposureFactor(days, end);
      const exposure = trades.reduce((sum, trade) => sum + trade.notionalAmount, 0) * 
        this.getPFEFactor(trades[0].assetClass, nettingSet.timeHorizon, nettingSet.confidenceLevel) * 
        exposureFactor;
      
      profile[dateStr] = exposure;
    }
    
    return profile;
  }
  
  /**
   * Calculate add-on for a set of trades
   * 
   * @param trades The trades to calculate add-on for
   * @returns The add-on amount
   */
  private static calculateAddOn(
    trades: PFETradeData[]
  ): number {
    // Implementation of add-on calculation based on SA-CCR
    // This is a simplified version for demonstration
    
    // Calculate adjusted notional
    const adjustedNotional = trades.reduce((sum, trade) => {
      // Apply adjustments based on transaction type
      const adjustment = 1.0;
      
      // Apply maturity factor
      const maturityDate = new Date(trade.maturityDate);
      const today = new Date();
      const maturityInYears = (maturityDate.getTime() - today.getTime()) / (365 * 24 * 60 * 60 * 1000);
      const maturityFactor = Math.min(1, Math.max(0.05, maturityInYears / 5));
      
      return sum + (trade.notionalAmount * adjustment * maturityFactor);
    }, 0);
    
    // Apply supervisory factor based on asset class
    const supervisoryFactor = this.getSupervisoryFactor(trades[0].assetClass);
    
    return adjustedNotional * supervisoryFactor;
  }
  
  /**
   * Get supervisory factor for an asset class
   * 
   * @param assetClass The asset class
   * @returns The supervisory factor
   */
  private static getSupervisoryFactor(assetClass: AssetClass): number {
    // Supervisory factors from SA-CCR
    switch (assetClass) {
      case AssetClass.INTEREST_RATE:
        return 0.005;
      case AssetClass.FOREIGN_EXCHANGE:
        return 0.04;
      case AssetClass.CREDIT:
        return 0.05;
      case AssetClass.EQUITY:
        return 0.32;
      case AssetClass.COMMODITY:
        return 0.18;
      default:
        return 0.15; // Default factor
    }
  }
  
  /**
   * Get PFE factor based on asset class, time horizon, and confidence level
   * 
   * @param assetClass The asset class
   * @param timeHorizon The time horizon
   * @param confidenceLevel The confidence level
   * @returns The PFE factor
   */
  private static getPFEFactor(
    assetClass: AssetClass,
    timeHorizon: PFETimeHorizon,
    confidenceLevel: PFEConfidenceLevel
  ): number {
    // Base factor from supervisory factor
    const baseFactor = this.getSupervisoryFactor(assetClass);
    
    // Adjust for time horizon
    const timeHorizonFactor = this.getTimeHorizonFactor(timeHorizon);
    
    // Adjust for confidence level
    const confidenceFactor = this.getConfidenceFactor(confidenceLevel);
    
    return baseFactor * timeHorizonFactor * confidenceFactor;
  }
  
  /**
   * Get time horizon factor
   * 
   * @param timeHorizon The time horizon
   * @returns The time horizon factor
   */
  private static getTimeHorizonFactor(timeHorizon: PFETimeHorizon): number {
    // Time horizon factors based on square root of time
    switch (timeHorizon) {
      case PFETimeHorizon.ONE_WEEK:
        return Math.sqrt(7 / 365);
      case PFETimeHorizon.TWO_WEEKS:
        return Math.sqrt(14 / 365);
      case PFETimeHorizon.ONE_MONTH:
        return Math.sqrt(30 / 365);
      case PFETimeHorizon.THREE_MONTHS:
        return Math.sqrt(90 / 365);
      case PFETimeHorizon.SIX_MONTHS:
        return Math.sqrt(180 / 365);
      case PFETimeHorizon.ONE_YEAR:
        return 1.0;
      default:
        return 1.0;
    }
  }
  
  /**
   * Get confidence factor
   * 
   * @param confidenceLevel The confidence level
   * @returns The confidence factor
   */
  private static getConfidenceFactor(confidenceLevel: PFEConfidenceLevel): number {
    // Confidence factors based on normal distribution quantiles
    switch (confidenceLevel) {
      case PFEConfidenceLevel.NINETY_FIVE_PERCENT:
        return 1.645;
      case PFEConfidenceLevel.NINETY_SEVEN_POINT_FIVE_PERCENT:
        return 1.96;
      case PFEConfidenceLevel.NINETY_NINE_PERCENT:
        return 2.326;
      default:
        return 1.645;
    }
  }
  
  /**
   * Get asset class volatility
   * 
   * @param assetClass The asset class
   * @returns The volatility
   */
  private static getAssetClassVolatility(assetClass: AssetClass): number {
    // Asset class volatilities for internal model
    switch (assetClass) {
      case AssetClass.INTEREST_RATE:
        return 0.01;
      case AssetClass.FOREIGN_EXCHANGE:
        return 0.08;
      case AssetClass.CREDIT:
        return 0.10;
      case AssetClass.EQUITY:
        return 0.20;
      case AssetClass.COMMODITY:
        return 0.15;
      default:
        return 0.12;
    }
  }
  
  /**
   * Get historical volatility
   * 
   * @param assetClass The asset class
   * @returns The historical volatility
   */
  private static getHistoricalVolatility(assetClass: AssetClass): number {
    // Historical volatilities based on stress periods
    switch (assetClass) {
      case AssetClass.INTEREST_RATE:
        return 0.015;
      case AssetClass.FOREIGN_EXCHANGE:
        return 0.12;
      case AssetClass.CREDIT:
        return 0.15;
      case AssetClass.EQUITY:
        return 0.30;
      case AssetClass.COMMODITY:
        return 0.25;
      default:
        return 0.18;
    }
  }
  
  /**
   * Get time horizon in days
   * 
   * @param timeHorizon The time horizon
   * @returns The time horizon in days
   */
  private static getTimeHorizonInDays(timeHorizon: PFETimeHorizon): number {
    // Convert time horizon to days
    switch (timeHorizon) {
      case PFETimeHorizon.ONE_WEEK:
        return 7;
      case PFETimeHorizon.TWO_WEEKS:
        return 14;
      case PFETimeHorizon.ONE_MONTH:
        return 30;
      case PFETimeHorizon.THREE_MONTHS:
        return 90;
      case PFETimeHorizon.SIX_MONTHS:
        return 180;
      case PFETimeHorizon.ONE_YEAR:
        return 365;
      default:
        return 365;
    }
  }
  
  /**
   * Add days to today
   * 
   * @param days The number of days to add
   * @returns The new date
   */
  private static addDaysToToday(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
  
  /**
   * Get exposure factor
   * 
   * @param days The number of days
   * @param totalDays The total number of days
   * @returns The exposure factor
   */
  private static getExposureFactor(days: number, totalDays: number): number {
    // Exposure profile shape (simplified)
    // Typically rises and then falls
    if (days === 0) {
      return 0.2; // Initial exposure
    } else if (days >= totalDays) {
      return 0.5; // Final exposure
    } else {
      // Peak in the middle
      const normalizedTime = days / totalDays;
      return 0.2 + Math.sin(normalizedTime * Math.PI) * 0.8;
    }
  }
}
