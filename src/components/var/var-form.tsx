"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaRParametersForm } from './var-parameters-form';
import { VaRPositionsForm } from './var-positions-form';
import { VaRResults } from './var-results';
import { VaRFormSchemaType, varFormSchema } from '@/lib/var/schema';
import { VaRAssetType, VaRCalculationMethod, VaRConfidenceLevel, VaRTimeHorizon } from '@/lib/var/types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';

/**
 * Historical Value at Risk (VaR) Calculator Form
 * 
 * This component provides a form for calculating VaR for a portfolio of positions.
 */
export function VaRForm() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFetchingExternalData, setIsFetchingExternalData] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('parameters');

  // Default form values
  const defaultValues: VaRFormSchemaType = {
    parameters: {
      timeHorizon: VaRTimeHorizon.ONE_DAY,
      confidenceLevel: VaRConfidenceLevel.NINETY_FIVE_PERCENT,
      calculationMethod: VaRCalculationMethod.HISTORICAL_SIMULATION,
      lookbackPeriod: 252,
      includeCorrelations: true,
    },
    positions: [
      {
        id: uuidv4(),
        assetType: VaRAssetType.EQUITY,
        assetIdentifier: 'AAPL',
        quantity: 100,
        currentPrice: 150,
        currency: 'USD',
      },
    ],
    useExternalData: false,
    dataSource: 'alpha_vantage',
  };

  // Initialize form
  const form = useForm<VaRFormSchemaType>({
    resolver: zodResolver(varFormSchema),
    defaultValues,
  });

  // Watch for changes in useExternalData to show guidance
  const useExternalData = form.watch('useExternalData');
  const dataSource = form.watch('dataSource');

  // Handle form submission
  const onSubmit = async (data: VaRFormSchemaType) => {
    setError(null);
    setIsCalculating(true);
    
    if (data.useExternalData) {
      setIsFetchingExternalData(true);
    }
    
    try {
      const response = await fetch('/api/calculate/var', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate VaR');
      }

      const result = await response.json();
      setResults(result);
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsCalculating(false);
      setIsFetchingExternalData(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Historical Value at Risk (VaR) Calculator</CardTitle>
        <CardDescription>
          Calculate the potential loss of a portfolio over a specific time horizon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="parameters">Parameters</TabsTrigger>
                <TabsTrigger value="positions">Positions</TabsTrigger>
                <TabsTrigger value="results" disabled={!results}>
                  Results
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="parameters" className="space-y-4 py-4">
                <VaRParametersForm form={form} />
                
                {useExternalData && (
                  <Alert variant="default" className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertTitle>Using External Market Data</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">
                        You've enabled external market data fetching. Here's how to use it effectively:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>
                          <strong>Asset Identifiers:</strong> Make sure to use the correct format for each asset type:
                          <ul className="list-disc pl-5 mt-1">
                            <li><strong>Equities:</strong> Use stock ticker symbols (e.g., AAPL, MSFT)</li>
                            <li><strong>Forex:</strong> Use currency pairs in FROM_TO format (e.g., EUR_USD)</li>
                            <li><strong>Crypto:</strong> Use coin IDs (e.g., bitcoin, ethereum)</li>
                            <li><strong>Interest Rates:</strong> Use FRED series IDs (e.g., DFF for Federal Funds Rate)</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Data Source:</strong> {dataSource === 'alpha_vantage' ? 'Alpha Vantage provides stock and forex data' : 
                                                        dataSource === 'coingecko' ? 'CoinGecko provides cryptocurrency data' : 
                                                        dataSource === 'fred' ? 'FRED provides economic and interest rate data' : 
                                                        'Select a data source that supports your asset types'}
                        </li>
                        <li>
                          <strong>Note:</strong> If external data cannot be fetched, the calculator will fall back to synthetic data.
                        </li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
              
              <TabsContent value="positions" className="py-4">
                <VaRPositionsForm form={form} />
              </TabsContent>
              
              <TabsContent value="results" className="py-4">
                {results && <VaRResults results={results} />}
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => form.reset(defaultValues)}
                disabled={isCalculating}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isCalculating}>
                {isCalculating ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">
                      {isFetchingExternalData ? 'Fetching Data...' : 'Calculating...'}
                    </span>
                  </div>
                ) : (
                  'Calculate VaR'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
