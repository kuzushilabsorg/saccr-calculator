import {
  VaRInput,
  VaRResult,
  VaRPosition,
  HistoricalMarketData,
  VaRTimeHorizon,
  VaRCalculationMethod,
  MarketDataPoint,
} from './types';

/**
 * Calculator for Historical Value at Risk (VaR)
 * 
 * This class implements the calculation of VaR for a portfolio of positions
 * using historical market data.
 */
export class VaRCalculator {
  /**
   * Calculate Value at Risk (VaR) for a portfolio
   * 
   * @param input The VaR calculation input
   * @returns The VaR calculation result
   */
  public static calculateVaR(input: VaRInput): VaRResult {
    // Extract input parameters
    const { positions, parameters, historicalData } = input;
    
    // Calculate portfolio value
    const portfolioValue = this.calculatePortfolioValue(positions);
    
    // Calculate returns for each position based on historical data
    const positionReturns = this.calculatePositionReturns(positions, historicalData || []);
    
    // Calculate portfolio returns
    const portfolioReturns = this.calculatePortfolioReturns(positions, positionReturns);
    
    // Calculate VaR based on the specified method
    let valueAtRisk = 0;
    let expectedShortfall = 0;
    
    switch (parameters.calculationMethod) {
      case VaRCalculationMethod.HISTORICAL_SIMULATION:
        ({ valueAtRisk, expectedShortfall } = this.calculateHistoricalVaR(
          portfolioValue, 
          portfolioReturns, 
          parameters.confidenceLevel
        ));
        break;
      
      case VaRCalculationMethod.MONTE_CARLO_SIMULATION:
        ({ valueAtRisk, expectedShortfall } = this.calculateMonteCarloVaR(
          portfolioValue, 
          positions, 
          positionReturns, 
          parameters
        ));
        break;
      
      case VaRCalculationMethod.PARAMETRIC:
        ({ valueAtRisk, expectedShortfall } = this.calculateParametricVaR(
          portfolioValue, 
          portfolioReturns, 
          parameters.confidenceLevel
        ));
        break;
      
      default:
        // Default to historical simulation
        ({ valueAtRisk, expectedShortfall } = this.calculateHistoricalVaR(
          portfolioValue, 
          portfolioReturns, 
          parameters.confidenceLevel
        ));
    }
    
    // Scale VaR for the specified time horizon
    valueAtRisk = this.scaleVaR(valueAtRisk, parameters.timeHorizon);
    expectedShortfall = this.scaleVaR(expectedShortfall, parameters.timeHorizon);
    
    // Calculate asset contributions to VaR
    const assetContributions = this.calculateAssetContributions(
      positions, 
      positionReturns, 
      valueAtRisk, 
      portfolioValue,
      parameters
    );
    
    // Calculate diversification benefit
    const sumIndividualVaRs = Object.values(assetContributions).reduce(
      (sum, asset) => sum + asset.valueAtRisk, 
      0
    );
    const diversificationBenefit = sumIndividualVaRs - valueAtRisk;
    
    // Calculate return distribution statistics
    const returnDistribution = this.calculateReturnDistribution(portfolioReturns);
    
    // Calculate stress scenarios
    const stressScenarios = this.calculateStressScenarios(portfolioValue, portfolioReturns);
    
    // Return result
    return {
      valueAtRisk,
      portfolioValue,
      varPercentage: (valueAtRisk / portfolioValue) * 100,
      expectedShortfall,
      assetContributions,
      diversificationBenefit,
      returnDistribution,
      stressScenarios,
      timestamp: new Date().toISOString(),
      parameters,
    };
  }
  
  /**
   * Calculate the total value of the portfolio
   * 
   * @param positions The portfolio positions
   * @returns The total portfolio value
   */
  private static calculatePortfolioValue(positions: VaRPosition[]): number {
    return positions.reduce((sum, position) => {
      return sum + (position.quantity * position.currentPrice);
    }, 0);
  }
  
  /**
   * Calculate historical returns for each position
   * 
   * @param positions The portfolio positions
   * @param historicalData Historical market data
   * @returns Returns for each position
   */
  private static calculatePositionReturns(
    positions: VaRPosition[],
    historicalData: HistoricalMarketData[]
  ): Record<string, number[]> {
    const returns: Record<string, number[]> = {};
    
    positions.forEach(position => {
      // Find historical data for this position
      const data = historicalData.find(d => 
        d.assetIdentifier === position.assetIdentifier && 
        d.assetType === position.assetType
      );
      
      if (data && data.data.length > 1) {
        // Calculate daily returns
        const dailyReturns = this.calculateDailyReturns(data.data);
        returns[position.id] = dailyReturns;
      } else {
        // If no historical data, use a default (this should be improved in production)
        returns[position.id] = this.generateSyntheticReturns(position);
      }
    });
    
    return returns;
  }
  
  /**
   * Calculate daily returns from historical price data
   * 
   * @param data Historical price data
   * @returns Array of daily returns
   */
  private static calculateDailyReturns(data: MarketDataPoint[]): number[] {
    const returns: number[] = [];
    
    // Sort data by date
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate returns
    for (let i = 1; i < sortedData.length; i++) {
      const previousPrice = sortedData[i - 1].price;
      const currentPrice = sortedData[i].price;
      
      if (previousPrice > 0) {
        const returnValue = (currentPrice - previousPrice) / previousPrice;
        returns.push(returnValue);
      }
    }
    
    return returns;
  }
  
  /**
   * Generate synthetic returns for a position when historical data is not available
   * 
   * @param position The position
   * @returns Array of synthetic returns
   */
  private static generateSyntheticReturns(position: VaRPosition): number[] {
    // Generate 252 synthetic returns (approximately 1 year of trading days)
    const returns: number[] = [];
    
    // Use different volatility assumptions based on asset type
    let volatility = 0.01; // Default 1% daily volatility
    
    switch (position.assetType) {
      case 'EQUITY':
        volatility = 0.015; // 1.5% for equities
        break;
      case 'FOREIGN_EXCHANGE':
        volatility = 0.008; // 0.8% for FX
        break;
      case 'INTEREST_RATE':
        volatility = 0.003; // 0.3% for interest rates
        break;
      case 'COMMODITY':
        volatility = 0.02; // 2% for commodities
        break;
      case 'CRYPTO':
        volatility = 0.05; // 5% for crypto
        break;
    }
    
    // Generate returns using normal distribution
    for (let i = 0; i < 252; i++) {
      // Box-Muller transform to generate normal random numbers
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Apply volatility
      const returnValue = z * volatility;
      returns.push(returnValue);
    }
    
    return returns;
  }

  /**
   * Calculate portfolio returns based on position returns and weights
   * 
   * @param positions The portfolio positions
   * @param positionReturns Returns for each position
   * @returns Array of portfolio returns
   */
  private static calculatePortfolioReturns(
    positions: VaRPosition[],
    positionReturns: Record<string, number[]>
  ): number[] {
    // Calculate portfolio value for weighting
    const portfolioValue = this.calculatePortfolioValue(positions);
    
    // Calculate position weights
    const weights: Record<string, number> = {};
    positions.forEach(position => {
      weights[position.id] = (position.quantity * position.currentPrice) / portfolioValue;
    });
    
    // Find the minimum length of return series
    const minLength = Math.min(
      ...Object.values(positionReturns).map(returns => returns.length)
    );
    
    // Calculate weighted portfolio returns
    const portfolioReturns: number[] = [];
    
    for (let i = 0; i < minLength; i++) {
      let returnForDay = 0;
      
      Object.entries(positionReturns).forEach(([positionId, returns]) => {
        returnForDay += returns[i] * weights[positionId];
      });
      
      portfolioReturns.push(returnForDay);
    }
    
    return portfolioReturns;
  }
  
  /**
   * Calculate VaR using historical simulation method
   * 
   * @param portfolioValue The total portfolio value
   * @param portfolioReturns Historical portfolio returns
   * @param confidenceLevel The confidence level for VaR
   * @returns The VaR and Expected Shortfall values
   */
  private static calculateHistoricalVaR(
    portfolioValue: number,
    portfolioReturns: number[],
    confidenceLevel: string
  ): { valueAtRisk: number; expectedShortfall: number } {
    // Sort returns in ascending order (from worst to best)
    const sortedReturns = [...portfolioReturns].sort((a, b) => a - b);
    
    // Extract confidence level percentage
    const confidencePercentage = parseFloat(confidenceLevel.replace('%', '')) / 100;
    
    // Calculate index for VaR
    const varIndex = Math.floor(sortedReturns.length * (1 - confidencePercentage));
    
    // Get VaR return
    const varReturn = Math.abs(sortedReturns[varIndex]);
    
    // Calculate VaR amount
    const valueAtRisk = portfolioValue * varReturn;
    
    // Calculate Expected Shortfall (average of returns beyond VaR)
    let expectedShortfallSum = 0;
    for (let i = 0; i < varIndex; i++) {
      expectedShortfallSum += Math.abs(sortedReturns[i]);
    }
    
    const expectedShortfallReturn = expectedShortfallSum / varIndex;
    const expectedShortfall = portfolioValue * expectedShortfallReturn;
    
    return { valueAtRisk, expectedShortfall };
  }
  
  /**
   * Calculate VaR using parametric method (variance-covariance)
   * 
   * @param portfolioValue The total portfolio value
   * @param portfolioReturns Historical portfolio returns
   * @param confidenceLevel The confidence level for VaR
   * @returns The VaR and Expected Shortfall values
   */
  private static calculateParametricVaR(
    portfolioValue: number,
    portfolioReturns: number[],
    confidenceLevel: string
  ): { valueAtRisk: number; expectedShortfall: number } {
    // Calculate mean and standard deviation of returns
    const mean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
    
    const variance = portfolioReturns.reduce(
      (sum, ret) => sum + Math.pow(ret - mean, 2), 
      0
    ) / portfolioReturns.length;
    
    const stdDev = Math.sqrt(variance);
    
    // Get z-score for confidence level
    let zScore = 1.645; // Default for 95%
    
    switch (confidenceLevel) {
      case '90%':
        zScore = 1.282;
        break;
      case '95%':
        zScore = 1.645;
        break;
      case '97.5%':
        zScore = 1.96;
        break;
      case '99%':
        zScore = 2.326;
        break;
    }
    
    // Calculate VaR
    const varReturn = zScore * stdDev - mean; // Subtract mean for more accurate VaR
    const valueAtRisk = portfolioValue * Math.max(0, varReturn); // Ensure non-negative
    
    // Calculate Expected Shortfall for normal distribution
    // ES = mean - (stdDev * phi(Phi^-1(alpha)) / alpha)
    // where phi is the PDF and Phi^-1 is the inverse CDF of normal distribution
    // For simplicity, we use an approximation
    const esMultiplier = {
      '90%': 1.755,
      '95%': 2.063,
      '97.5%': 2.338,
      '99%': 2.665,
    }[confidenceLevel] || 2.063;
    
    const expectedShortfallReturn = esMultiplier * stdDev - mean;
    const expectedShortfall = portfolioValue * Math.max(0, expectedShortfallReturn);
    
    return { valueAtRisk, expectedShortfall };
  }
  
  /**
   * Calculate VaR using Monte Carlo simulation
   * 
   * @param portfolioValue The total portfolio value
   * @param positions The portfolio positions
   * @param positionReturns Historical returns for each position
   * @param parameters VaR calculation parameters
   * @returns The VaR and Expected Shortfall values
   */
  private static calculateMonteCarloVaR(
    portfolioValue: number,
    positions: VaRPosition[],
    positionReturns: Record<string, number[]>,
    parameters: VaRInput['parameters']
  ): { valueAtRisk: number; expectedShortfall: number } {
    // Number of simulations
    const numSimulations = 10000;
    
    // Calculate mean and standard deviation for each position
    const stats: Record<string, { mean: number; stdDev: number }> = {};
    
    Object.entries(positionReturns).forEach(([positionId, returns]) => {
      const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      
      const variance = returns.reduce(
        (sum, ret) => sum + Math.pow(ret - mean, 2), 
        0
      ) / returns.length;
      
      const stdDev = Math.sqrt(variance);
      
      stats[positionId] = { mean, stdDev };
    });
    
    // Calculate position weights
    const weights: Record<string, number> = {};
    positions.forEach(position => {
      weights[position.id] = (position.quantity * position.currentPrice) / portfolioValue;
    });
    
    // Generate simulated portfolio returns
    const simulatedReturns: number[] = [];
    
    for (let i = 0; i < numSimulations; i++) {
      let portfolioReturn = 0;
      
      // Generate return for each position
      positions.forEach(position => {
        const { mean, stdDev } = stats[position.id];
        
        // Generate normal random number
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        // Apply mean and standard deviation
        const positionReturn = mean + z * stdDev;
        
        // Add weighted return to portfolio return
        portfolioReturn += positionReturn * weights[position.id];
      });
      
      simulatedReturns.push(portfolioReturn);
    }
    
    // Calculate VaR using the simulated returns
    return this.calculateHistoricalVaR(
      portfolioValue, 
      simulatedReturns, 
      parameters.confidenceLevel
    );
  }
  
  /**
   * Scale VaR for different time horizons
   * 
   * @param dailyVaR The daily VaR value
   * @param timeHorizon The target time horizon
   * @returns The scaled VaR value
   */
  private static scaleVaR(dailyVaR: number, timeHorizon: VaRTimeHorizon): number {
    // Scale factor based on square root of time rule
    let scaleFactor = 1;
    
    switch (timeHorizon) {
      case VaRTimeHorizon.ONE_DAY:
        scaleFactor = 1;
        break;
      case VaRTimeHorizon.TEN_DAYS:
        scaleFactor = Math.sqrt(10);
        break;
      case VaRTimeHorizon.ONE_MONTH:
        scaleFactor = Math.sqrt(21); // Approximately 21 trading days in a month
        break;
      case VaRTimeHorizon.THREE_MONTHS:
        scaleFactor = Math.sqrt(63); // Approximately 63 trading days in 3 months
        break;
    }
    
    return dailyVaR * scaleFactor;
  }
  
  /**
   * Calculate asset contributions to total VaR
   * 
   * @param positions The portfolio positions
   * @param positionReturns Returns for each position
   * @param totalVaR The total portfolio VaR
   * @param portfolioValue The total portfolio value
   * @param parameters VaR calculation parameters
   * @returns Asset contributions to VaR
   */
  private static calculateAssetContributions(
    positions: VaRPosition[],
    positionReturns: Record<string, number[]>,
    totalVaR: number,
    portfolioValue: number,
    parameters: VaRInput['parameters']
  ): VaRResult['assetContributions'] {
    const assetContributions: VaRResult['assetContributions'] = {};
    
    // Calculate individual VaR for each position
    positions.forEach(position => {
      const positionValue = position.quantity * position.currentPrice;
      // Keeping track of position value for potential future weighting calculations
      // const weight = positionValue / portfolioValue;
      
      // Calculate VaR for this position
      const returns = positionReturns[position.id];
      
      let positionVaR = 0;
      
      if (parameters.calculationMethod === VaRCalculationMethod.HISTORICAL_SIMULATION) {
        // Use historical simulation for individual position
        const { valueAtRisk } = this.calculateHistoricalVaR(
          positionValue, 
          returns, 
          parameters.confidenceLevel
        );
        positionVaR = valueAtRisk;
      } else if (parameters.calculationMethod === VaRCalculationMethod.PARAMETRIC) {
        // Use parametric method for individual position
        const { valueAtRisk } = this.calculateParametricVaR(
          positionValue, 
          returns, 
          parameters.confidenceLevel
        );
        positionVaR = valueAtRisk;
      } else {
        // Default method
        const { valueAtRisk } = this.calculateHistoricalVaR(
          positionValue, 
          returns, 
          parameters.confidenceLevel
        );
        positionVaR = valueAtRisk;
      }
      
      // Scale for time horizon
      positionVaR = this.scaleVaR(positionVaR, parameters.timeHorizon);
      
      // Calculate contribution percentage
      const contribution = (positionVaR / totalVaR) * 100;
      
      assetContributions[position.assetIdentifier] = {
        valueAtRisk: positionVaR,
        contribution,
      };
    });
    
    return assetContributions;
  }
  
  /**
   * Calculate return distribution statistics
   * 
   * @param returns Array of returns
   * @returns Return distribution statistics
   */
  private static calculateReturnDistribution(returns: number[]): VaRResult['returnDistribution'] {
    // Calculate basic statistics
    const min = Math.min(...returns);
    const max = Math.max(...returns);
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    
    // Calculate median
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const midPoint = Math.floor(sortedReturns.length / 2);
    const median = sortedReturns.length % 2 === 0
      ? (sortedReturns[midPoint - 1] + sortedReturns[midPoint]) / 2
      : sortedReturns[midPoint];
    
    // Calculate standard deviation
    const variance = returns.reduce(
      (sum, ret) => sum + Math.pow(ret - mean, 2), 
      0
    ) / returns.length;
    
    const standardDeviation = Math.sqrt(variance);
    
    // Calculate skewness
    const skewness = returns.reduce(
      (sum, ret) => sum + Math.pow(ret - mean, 3), 
      0
    ) / (returns.length * Math.pow(standardDeviation, 3));
    
    // Calculate kurtosis
    const kurtosis = returns.reduce(
      (sum, ret) => sum + Math.pow(ret - mean, 4), 
      0
    ) / (returns.length * Math.pow(standardDeviation, 4)) - 3; // Excess kurtosis
    
    return {
      min,
      max,
      mean,
      median,
      standardDeviation,
      skewness,
      kurtosis,
    };
  }
  
  /**
   * Calculate stress scenarios
   * 
   * @param portfolioValue The total portfolio value
   * @param returns Historical returns
   * @returns Stress scenario results
   */
  private static calculateStressScenarios(
    portfolioValue: number,
    returns: number[]
  ): VaRResult['stressScenarios'] {
    // Sort returns from worst to best
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    // Define stress scenarios
    const scenarios: VaRResult['stressScenarios'] = {
      'Worst Day': portfolioValue * Math.abs(sortedReturns[0]),
      'Second Worst Day': portfolioValue * Math.abs(sortedReturns[1]),
      'Third Worst Day': portfolioValue * Math.abs(sortedReturns[2]),
      'Average of 5 Worst Days': portfolioValue * (
        Math.abs(sortedReturns[0]) + 
        Math.abs(sortedReturns[1]) + 
        Math.abs(sortedReturns[2]) + 
        Math.abs(sortedReturns[3]) + 
        Math.abs(sortedReturns[4])
      ) / 5,
      '2008 Financial Crisis': portfolioValue * 0.40, // Simplified assumption of 40% loss
      'COVID-19 Crash': portfolioValue * 0.30, // Simplified assumption of 30% loss
    };
    
    return scenarios;
  }
}
