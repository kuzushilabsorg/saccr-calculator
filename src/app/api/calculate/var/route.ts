import { NextRequest, NextResponse } from 'next/server';
import { VaRCalculator } from '@/lib/var/var-calculator';
import { varFormSchema } from '@/lib/var/schema';
import { VaRInput, HistoricalMarketData, MarketDataPoint, VaRAssetType, VaRPosition, VaRTimeHorizon, VaRConfidenceLevel, VaRCalculationMethod } from '@/lib/var/types';
import { DATA_PROVIDERS } from '@/lib/var/market-data-service';
import { parse } from 'csv-parse/sync';

/**
 * Generate synthetic historical market data for testing and fallback
 * 
 * @param positions Array of positions to generate data for
 * @returns Array of historical market data for each position
 */
function generateSyntheticHistoricalData(positions: VaRPosition[]): HistoricalMarketData[] {
  return positions.map(position => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 252); // 1 year of trading days
    
    const data: MarketDataPoint[] = [];
    let currentPrice = position.currentPrice;
    
    // Generate 252 days of synthetic data (1 year of trading days)
    for (let i = 0; i < 252; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }
      
      // Random daily return between -3% and 3%
      const dailyReturn = (Math.random() * 0.06) - 0.03;
      currentPrice = currentPrice * (1 + dailyReturn);
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: currentPrice,
        volume: Math.floor(Math.random() * 1000000) + 100000 // Random volume
      });
    }
    
    return {
      assetIdentifier: position.assetIdentifier,
      assetType: position.assetType,
      currency: position.currency,
      data,
      metadata: {
        dataSource: 'synthetic',
        dataPoints: data.length,
        startDate: data[0].date,
        endDate: data[data.length - 1].date,
      }
    };
  });
}

/**
 * API endpoint for calculating Value at Risk (VaR)
 * 
 * @param request The HTTP request
 * @returns The HTTP response with VaR calculation results
 */
export async function POST(request: NextRequest) {
  try {
    // Check if the request is a CSV upload (FormData) or a JSON payload
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle CSV file upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
      
      if (!file.name.toLowerCase().endsWith('.csv')) {
        return NextResponse.json(
          { error: 'Only CSV files are supported' },
          { status: 400 }
        );
      }
      
      // Read the file content
      const fileContent = await file.text();
      
      try {
        // Parse CSV data
        const records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }) as Array<Record<string, string>>;
        
        if (records.length === 0) {
          return NextResponse.json(
            { error: 'CSV file is empty or invalid' },
            { status: 400 }
          );
        }
        
        // Validate required columns
        const requiredColumns = ['date', 'assetIdentifier', 'assetType', 'price', 'currency'];
        const csvColumns = Object.keys(records[0]);
        
        const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col));
        if (missingColumns.length > 0) {
          return NextResponse.json(
            { 
              error: 'CSV file is missing required columns', 
              details: `Missing columns: ${missingColumns.join(', ')}` 
            },
            { status: 400 }
          );
        }
        
        // Group records by asset
        const assetGroups = records.reduce((groups: Record<string, Array<Record<string, string>>>, record) => {
          const key = `${record.assetIdentifier}_${record.assetType}`;
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(record);
          return groups;
        }, {});
        
        // Convert to HistoricalMarketData format
        const historicalData: HistoricalMarketData[] = Object.entries(assetGroups).map(([key, records]) => {
          const [assetIdentifier, assetTypeStr] = key.split('_');
          const assetType = assetTypeStr as VaRAssetType;
          const firstRecord = records[0];
          
          // Sort records by date (ascending)
          records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          return {
            assetIdentifier,
            assetType,
            currency: firstRecord.currency,
            data: records.map(record => ({
              date: record.date,
              price: parseFloat(record.price),
              volume: record.volume ? parseFloat(record.volume) : 0
            })),
            metadata: {
              dataSource: 'csv_upload',
              dataPoints: records.length,
              startDate: records[0].date,
              endDate: records[records.length - 1].date,
            }
          };
        });
        
        if (historicalData.length === 0) {
          return NextResponse.json(
            { error: 'No valid historical data found in CSV file' },
            { status: 400 }
          );
        }
        
        // Extract unique assets for position creation
        const uniqueAssets = historicalData.map(data => ({
          assetIdentifier: data.assetIdentifier,
          assetType: data.assetType,
          currency: data.currency,
          // Use the most recent price as current price
          currentPrice: data.data[data.data.length - 1].price
        }));
        
        // Create positions from unique assets
        const positions: VaRPosition[] = uniqueAssets.map((asset, index) => ({
          id: `pos_${index + 1}`,
          assetIdentifier: asset.assetIdentifier,
          assetType: asset.assetType,
          quantity: 1, // Default quantity
          currentPrice: asset.currentPrice,
          currency: asset.currency
        }));
        
        // Prepare input for VaR calculator with default parameters
        const varInput: VaRInput = {
          positions,
          parameters: {
            timeHorizon: VaRTimeHorizon.ONE_DAY,
            confidenceLevel: VaRConfidenceLevel.NINETY_FIVE_PERCENT,
            calculationMethod: VaRCalculationMethod.HISTORICAL_SIMULATION,
            lookbackPeriod: historicalData[0].data.length,
            includeCorrelations: true,
          },
          historicalData
        };
        
        // Calculate VaR
        const result = VaRCalculator.calculateVaR(varInput);
        
        // Return the result
        return NextResponse.json({
          success: true,
          result
        });
      } catch (error) {
        console.error('Error parsing CSV:', error);
        return NextResponse.json(
          { error: 'Failed to parse CSV file', message: error instanceof Error ? error.message : String(error) },
          { status: 400 }
        );
      }
    } else {
      // Handle JSON payload (existing implementation)
      const body = await request.json();
      
      // Validate the input using Zod schema
      const validationResult = varFormSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validationResult.error.format() },
          { status: 400 }
        );
      }
      
      const validatedInput = validationResult.data;
      
      // Prepare input for VaR calculator
      const varInput: VaRInput = {
        positions: validatedInput.positions.map(position => ({
          ...position,
          quantity: Number(position.quantity),
          currentPrice: Number(position.currentPrice),
          // Convert Date to string if it exists
          purchaseDate: position.purchaseDate ? 
            (position.purchaseDate instanceof Date ? 
              position.purchaseDate.toISOString() : 
              position.purchaseDate) : 
            undefined
        })),
        parameters: {
          timeHorizon: validatedInput.parameters.timeHorizon,
          confidenceLevel: validatedInput.parameters.confidenceLevel,
          calculationMethod: validatedInput.parameters.calculationMethod,
          lookbackPeriod: Number(validatedInput.parameters.lookbackPeriod),
          includeCorrelations: validatedInput.parameters.includeCorrelations,
        },
      };
      
      // Use synthetic data for historical data
      varInput.historicalData = generateSyntheticHistoricalData(varInput.positions);
      
      // Calculate VaR
      const result = VaRCalculator.calculateVaR(varInput);
      
      // Return the result
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error calculating VaR:', error);
    return NextResponse.json(
      { error: 'Error calculating VaR', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
