"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VaRResult } from '@/lib/var/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface VaRResultsProps {
  results: VaRResult;
}

/**
 * VaR Results Component
 * 
 * This component displays the results of a VaR calculation.
 */
export function VaRResults({ results }: VaRResultsProps) {
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  // Format percentage values
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };
  
  // Prepare data for contribution chart
  const contributionChartData = Object.entries(results.assetContributions).map(
    ([assetIdentifier, { valueAtRisk, contribution }]) => ({
      name: assetIdentifier,
      value: contribution,
      valueAtRisk,
    })
  );
  
  // Prepare data for stress scenarios chart
  const stressChartData = results.stressScenarios
    ? Object.entries(results.stressScenarios).map(([scenario, value]) => ({
        name: scenario,
        value,
      }))
    : [];
  
  // Colors for charts
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FF6B6B', '#6B66FF', '#FFD166', '#06D6A0',
  ];
  
  // Determine if external data was used based on metadata
  const usedExternalData = results.metadata?.dataSource && results.metadata.dataSource !== 'synthetic';
  const dataSourceName = usedExternalData 
    ? results.metadata?.dataSource === 'alpha_vantage' 
      ? 'Alpha Vantage' 
      : results.metadata?.dataSource === 'coingecko' 
        ? 'CoinGecko' 
        : results.metadata?.dataSource === 'fred' 
          ? 'FRED (Federal Reserve Economic Data)' 
          : results.metadata?.dataSource
    : 'Synthetic Data';

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>VaR Summary</CardTitle>
          <CardDescription>
            Calculation completed on {new Date(results.timestamp).toLocaleString()}
            {results.metadata && (
              <div className="mt-1 text-sm">
                <span className="font-medium">Data Source:</span> {dataSourceName}
                {results.metadata.dataSourceNotes && (
                  <span className="ml-2 text-amber-600">{results.metadata.dataSourceNotes}</span>
                )}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Portfolio Value</h4>
              <p className="text-2xl font-bold">{formatCurrency(results.portfolioValue)}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Value at Risk (VaR)</h4>
              <p className="text-2xl font-bold">{formatCurrency(results.valueAtRisk)}</p>
              <p className="text-sm text-muted-foreground">
                {formatPercentage(results.varPercentage)} of portfolio value
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Expected Shortfall</h4>
              <p className="text-2xl font-bold">{formatCurrency(results.expectedShortfall)}</p>
              <p className="text-sm text-muted-foreground">
                Average loss in worst cases
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Results */}
      <Tabs defaultValue="contributions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contributions">Asset Contributions</TabsTrigger>
          <TabsTrigger value="stress">Stress Scenarios</TabsTrigger>
          <TabsTrigger value="distribution">Return Distribution</TabsTrigger>
        </TabsList>
        
        {/* Asset Contributions Tab */}
        <TabsContent value="contributions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Contributions to VaR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contribution Table */}
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead className="text-right">VaR</TableHead>
                        <TableHead className="text-right">Contribution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(results.assetContributions).map(
                        ([assetIdentifier, { valueAtRisk, contribution }]) => (
                          <TableRow key={assetIdentifier}>
                            <TableCell className="font-medium">{assetIdentifier}</TableCell>
                            <TableCell className="text-right">{formatCurrency(valueAtRisk)}</TableCell>
                            <TableCell className="text-right">{formatPercentage(contribution)}</TableCell>
                          </TableRow>
                        )
                      )}
                      <TableRow>
                        <TableCell className="font-medium">Diversification Benefit</TableCell>
                        <TableCell className="text-right">{formatCurrency(results.diversificationBenefit)}</TableCell>
                        <TableCell className="text-right">
                          {formatPercentage(
                            (results.diversificationBenefit / results.valueAtRisk) * 100
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                {/* Contribution Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contributionChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {contributionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${formatPercentage(Number(value))}`,
                          `Contribution`,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Stress Scenarios Tab */}
        <TabsContent value="stress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stress Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stress Scenarios Table */}
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scenario</TableHead>
                        <TableHead className="text-right">Potential Loss</TableHead>
                        <TableHead className="text-right">% of Portfolio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.stressScenarios &&
                        Object.entries(results.stressScenarios).map(([scenario, value]) => (
                          <TableRow key={scenario}>
                            <TableCell className="font-medium">{scenario}</TableCell>
                            <TableCell className="text-right">{formatCurrency(value)}</TableCell>
                            <TableCell className="text-right">
                              {formatPercentage(((value as number) / results.portfolioValue) * 100)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Stress Scenarios Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stressChartData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 'dataMax']} tickFormatter={(value) => formatCurrency(Number(value))} />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Potential Loss']} />
                      <Bar dataKey="value" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Return Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Return Distribution Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Distribution Statistics */}
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Statistic</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.returnDistribution && (
                        <>
                          <TableRow>
                            <TableCell>Minimum Return</TableCell>
                            <TableCell className="text-right">
                              {formatPercentage(results.returnDistribution.min * 100)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Maximum Return</TableCell>
                            <TableCell className="text-right">
                              {formatPercentage(results.returnDistribution.max * 100)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Mean Return</TableCell>
                            <TableCell className="text-right">
                              {formatPercentage(results.returnDistribution.mean * 100)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Median Return</TableCell>
                            <TableCell className="text-right">
                              {formatPercentage(results.returnDistribution.median * 100)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Standard Deviation</TableCell>
                            <TableCell className="text-right">
                              {formatPercentage(results.returnDistribution.standardDeviation * 100)}
                            </TableCell>
                          </TableRow>
                          {results.returnDistribution.skewness !== undefined && (
                            <TableRow>
                              <TableCell>Skewness</TableCell>
                              <TableCell className="text-right">
                                {results.returnDistribution.skewness.toFixed(4)}
                              </TableCell>
                            </TableRow>
                          )}
                          {results.returnDistribution.kurtosis !== undefined && (
                            <TableRow>
                              <TableCell>Excess Kurtosis</TableCell>
                              <TableCell className="text-right">
                                {results.returnDistribution.kurtosis.toFixed(4)}
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Additional Information */}
                <div className="space-y-4">
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-2">Calculation Parameters</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <span className="font-medium">Time Horizon:</span>{' '}
                        {results.parameters.timeHorizon.replace('_', ' ')}
                      </li>
                      <li>
                        <span className="font-medium">Confidence Level:</span>{' '}
                        {results.parameters.confidenceLevel}
                      </li>
                      <li>
                        <span className="font-medium">Calculation Method:</span>{' '}
                        {results.parameters.calculationMethod.replace('_', ' ')}
                      </li>
                      <li>
                        <span className="font-medium">Lookback Period:</span>{' '}
                        {results.parameters.lookbackPeriod} days
                      </li>
                      <li>
                        <span className="font-medium">Correlations Included:</span>{' '}
                        {results.parameters.includeCorrelations ? 'Yes' : 'No'}
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-2">Interpretation</h4>
                    <p className="text-sm text-muted-foreground">
                      With {results.parameters.confidenceLevel} confidence, the portfolio is not expected to lose more than{' '}
                      {formatCurrency(results.valueAtRisk)} over a{' '}
                      {results.parameters.timeHorizon.replace('_', ' ')} period.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      In the worst {100 - parseFloat(results.parameters.confidenceLevel.replace('%', ''))}% of cases,
                      the average loss is expected to be {formatCurrency(results.expectedShortfall)}.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
