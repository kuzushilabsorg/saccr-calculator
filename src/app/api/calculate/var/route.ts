import { NextResponse } from 'next/server';
import { VaRCalculator } from '@/lib/var/var-calculator';
import { varFormSchema } from '@/lib/var/schema';
import { VaRInput } from '@/lib/var/types';

/**
 * API endpoint for calculating Value at Risk (VaR)
 * 
 * @param request The HTTP request
 * @returns The HTTP response with VaR calculation results
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input using Zod schema
    const validatedInput = varFormSchema.parse(body);
    
    // Convert form input to VaR input
    const varInput: VaRInput = {
      positions: validatedInput.positions.map(position => ({
        id: position.id,
        assetType: position.assetType,
        assetIdentifier: position.assetIdentifier,
        quantity: Number(position.quantity),
        currentPrice: Number(position.currentPrice),
        currency: position.currency,
        purchaseDate: position.purchaseDate,
      })),
      parameters: {
        timeHorizon: validatedInput.parameters.timeHorizon,
        confidenceLevel: validatedInput.parameters.confidenceLevel,
        calculationMethod: validatedInput.parameters.calculationMethod,
        lookbackPeriod: Number(validatedInput.parameters.lookbackPeriod),
        includeCorrelations: validatedInput.parameters.includeCorrelations,
      },
    };
    
    // If external data is requested, fetch it
    if (validatedInput.useExternalData && validatedInput.dataSource) {
      // In a real implementation, this would fetch data from an external API
      // For now, we'll use synthetic data
      varInput.historicalData = generateSyntheticHistoricalData(varInput.positions);
    } else {
      // Use synthetic data for demonstration
      varInput.historicalData = generateSyntheticHistoricalData(varInput.positions);
    }
    
    // Calculate VaR
    const result = VaRCalculator.calculateVaR(varInput);
    
    // Return result
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating VaR:', error);
    
    // Return error response
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}

/**
 * Generate synthetic historical data for demonstration purposes
 * 
 * @param positions The portfolio positions
 * @returns Synthetic historical market data
 */
function generateSyntheticHistoricalData(positions: VaRInput['positions']) {
  return positions.map(position => {
    // Generate 252 days of synthetic data (approximately 1 year of trading days)
    const data = [];
    
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
    
    // Start price at current price
    let price = position.currentPrice;
    
    // Generate data for the past year (252 trading days)
    for (let i = 252; i >= 0; i--) {
      // Generate random return
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Apply volatility to get daily return
      const dailyReturn = z * volatility;
      
      // Apply return to price (going backwards in time)
      if (i < 252) {
        price = price / (1 + dailyReturn);
      }
      
      // Add data point
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        price,
        volume: Math.floor(Math.random() * 1000000) + 100000, // Random volume
      });
    }
    
    return {
      assetIdentifier: position.assetIdentifier,
      assetType: position.assetType,
      currency: position.currency,
      data,
    };
  });
}
