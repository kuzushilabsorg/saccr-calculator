'use client';

import { SACCRResult } from '@/lib/saccr/types';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ResultDisplayProps {
  result: SACCRResult;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  // Format number with commas and 2 decimal places
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Exposure at Default (EAD)
              </h3>
              <p className="text-3xl font-bold mt-2 text-primary">
                {formatNumber(result?.exposureAtDefault || 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Replacement Cost (RC)
              </h3>
              <p className="text-3xl font-bold mt-2 text-primary">
                {formatNumber(result?.replacementCost?.value || 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Potential Future Exposure (PFE)
              </h3>
              <p className="text-3xl font-bold mt-2 text-primary">
                {formatNumber(result?.potentialFutureExposure?.value || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replacement Cost Details */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <span className="mr-2">Replacement Cost Details</span>
            <Badge variant="outline" className="ml-2">
              {result?.inputSummary?.marginType || 'UNMARGINED'}
            </Badge>
          </h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">Component</TableHead>
                <TableHead className="text-right font-medium">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Current Market Value (V)</TableCell>
                <TableCell className="text-right">
                  {formatNumber(result?.replacementCost?.components?.currentExposure || 0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Collateral (C)</TableCell>
                <TableCell className="text-right">
                  {formatNumber(0)} {/* Placeholder for collateral */}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Threshold Amount (TH)</TableCell>
                <TableCell className="text-right">
                  {formatNumber(result?.replacementCost?.components?.threshold || 0)}
                </TableCell>
              </TableRow>
              {result?.inputSummary?.marginType === 'MARGINED' && (
                <>
                  <TableRow>
                    <TableCell>Minimum Transfer Amount (MTA)</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(
                        result?.replacementCost?.components?.minimumTransferAmount || 0
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Independent Collateral Amount (ICA)</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(
                        result?.replacementCost?.components?.independentCollateralAmount || 0
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Variation Margin (VM)</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(result?.replacementCost?.components?.variationMargin || 0)}
                    </TableCell>
                  </TableRow>
                </>
              )}
              <TableRow className="font-medium bg-muted/20">
                <TableCell>Total Replacement Cost</TableCell>
                <TableCell className="text-right">
                  {formatNumber(result?.replacementCost?.value || 0)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PFE Details */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">
            Potential Future Exposure Details
          </h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">Component</TableHead>
                <TableHead className="text-right font-medium">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Aggregate Add-On</TableCell>
                <TableCell className="text-right">
                  {formatNumber(result?.potentialFutureExposure?.aggregateAddOn || 0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Multiplier</TableCell>
                <TableCell className="text-right">
                  {(result?.potentialFutureExposure?.multiplier || 0).toFixed(4)}
                </TableCell>
              </TableRow>
              <TableRow className="font-medium bg-muted/20">
                <TableCell>Total PFE</TableCell>
                <TableCell className="text-right">
                  {formatNumber(result?.potentialFutureExposure?.value || 0)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Input Summary */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Input Summary</h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">Parameter</TableHead>
                <TableHead className="font-medium">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Netting Set</TableCell>
                <TableCell>{result?.inputSummary?.nettingSetId || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Margin Type</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {result?.inputSummary?.marginType || 'UNMARGINED'}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Number of Trades</TableCell>
                <TableCell>{result?.inputSummary?.tradeCount || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Asset Classes</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {result?.inputSummary?.assetClasses?.map((assetClass, index) => (
                      <Badge key={index} variant="secondary">
                        {assetClass}
                      </Badge>
                    )) || 'N/A'}
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Notional</TableCell>
                <TableCell>
                  {formatNumber(result?.inputSummary?.totalNotional || 0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Calculation Time</TableCell>
                <TableCell>
                  {result?.timestamp
                    ? new Date(result.timestamp).toLocaleString()
                    : 'N/A'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
