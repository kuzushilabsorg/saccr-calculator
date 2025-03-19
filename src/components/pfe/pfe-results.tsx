"use client";

import { PFEResult, PFEFormInput, PFECalculationMethod, PFETimeHorizon, PFEConfidenceLevel } from '@/lib/pfe/types';
import { AssetClass } from '@/lib/saccr/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface PFEResultsProps {
  result: PFEResult;
  formData?: PFEFormInput;
}

export default function PFEResults({ result, formData }: PFEResultsProps) {
  // Helper function to format asset class for display
  const formatAssetClass = (assetClass: AssetClass): string => {
    switch (assetClass) {
      case AssetClass.INTEREST_RATE:
        return 'Interest Rate';
      case AssetClass.FOREIGN_EXCHANGE:
        return 'Foreign Exchange';
      case AssetClass.CREDIT:
        return 'Credit';
      case AssetClass.EQUITY:
        return 'Equity';
      case AssetClass.COMMODITY:
        return 'Commodity';
      default:
        return assetClass;
    }
  };

  // Helper function to format calculation method for display
  const formatCalculationMethod = (method: PFECalculationMethod): string => {
    switch (method) {
      case PFECalculationMethod.REGULATORY_STANDARDISED_APPROACH:
        return 'Regulatory Standardised Approach';
      case PFECalculationMethod.INTERNAL_MODEL_METHOD:
        return 'Internal Model Method';
      case PFECalculationMethod.HISTORICAL_SIMULATION_METHOD:
        return 'Historical Simulation Method';
      case PFECalculationMethod.MONTE_CARLO_SIMULATION:
        return 'Monte Carlo Simulation';
      default:
        return method;
    }
  };

  // Helper function to format time horizon for display
  const formatTimeHorizon = (horizon: PFETimeHorizon): string => {
    switch (horizon) {
      case PFETimeHorizon.ONE_WEEK:
        return '1 Week';
      case PFETimeHorizon.TWO_WEEKS:
        return '2 Weeks';
      case PFETimeHorizon.ONE_MONTH:
        return '1 Month';
      case PFETimeHorizon.THREE_MONTHS:
        return '3 Months';
      case PFETimeHorizon.SIX_MONTHS:
        return '6 Months';
      case PFETimeHorizon.ONE_YEAR:
        return '1 Year';
      default:
        return horizon;
    }
  };

  // Helper function to format confidence level for display
  const formatConfidenceLevel = (level: PFEConfidenceLevel): string => {
    return level;
  };

  // Format exposure profile data for chart
  const exposureProfileData = Object.entries(result.exposureProfile).map(([date, value]) => ({
    date,
    pfe: value,
  }));

  // Format asset class breakdown data for chart
  const assetClassBreakdownData = Object.entries(result.assetClassBreakdown)
    .filter(([, value]) => value > 0)
    .map(([assetClass, value]) => ({
      assetClass: formatAssetClass(assetClass as AssetClass),
      value,
    }));

  // Colors for the bar chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Potential Future Exposure (PFE) Results</CardTitle>
        <CardDescription>
          {formatCalculationMethod(result.inputSummary.calculationMethod)} Approach
          {formData?.nettingSet?.nettingAgreementId && (
            <span className="block mt-1">
              Netting Agreement: {formData.nettingSet.nettingAgreementId}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="exposureProfile">Exposure Profile</TabsTrigger>
            <TabsTrigger value="assetClassBreakdown">Asset Class Breakdown</TabsTrigger>
          </TabsList>
          
          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-primary/10 rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground">Potential Future Exposure</h3>
                <p className="text-2xl font-bold">{result.potentialFutureExposure.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground">Expected Exposure</h3>
                <p className="text-2xl font-bold">{result.expectedExposure.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground">Peak Exposure</h3>
                <p className="text-2xl font-bold">{result.peakExposure.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Calculation Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Time Horizon</p>
                  <p className="font-medium">{formatTimeHorizon(result.inputSummary.timeHorizon)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidence Level</p>
                  <p className="font-medium">{formatConfidenceLevel(result.inputSummary.confidenceLevel)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Calculation Method</p>
                  <p className="font-medium">{formatCalculationMethod(result.inputSummary.calculationMethod)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margin Type</p>
                  <p className="font-medium">{result.inputSummary.marginType}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Portfolio Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Number of Trades</p>
                  <p className="font-medium">{result.inputSummary.tradeCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Notional</p>
                  <p className="font-medium">{result.inputSummary.totalNotional.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asset Classes</p>
                  <p className="font-medium">{result.inputSummary.assetClasses.map(ac => formatAssetClass(ac)).join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stressed PFE</p>
                  <p className="font-medium">{result.stressedPFE?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 'N/A'}</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Exposure Profile Tab */}
          <TabsContent value="exposureProfile">
            <div className="mt-4 h-80">
              <h3 className="text-lg font-medium mb-2">Exposure Profile Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={exposureProfileData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pfe" name="PFE" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          {/* Asset Class Breakdown Tab */}
          <TabsContent value="assetClassBreakdown">
            <div className="mt-4 h-80">
              <h3 className="text-lg font-medium mb-2">PFE by Asset Class</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={assetClassBreakdownData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="assetClass" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="PFE Contribution" fill="#8884d8">
                    {assetClassBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
