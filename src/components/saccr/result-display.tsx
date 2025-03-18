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

interface ResultDisplayProps {
  result: SACCRResult;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  // Format number with commas and 2 decimal places
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Exposure at Default (EAD)
              </h3>
              <p className="text-2xl font-bold mt-1">
                {formatNumber(result.exposureAtDefault)}
              </p>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Replacement Cost (RC)
              </h3>
              <p className="text-2xl font-bold mt-1">
                {formatNumber(result.replacementCost.value)}
              </p>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Potential Future Exposure (PFE)
              </h3>
              <p className="text-2xl font-bold mt-1">
                {formatNumber(result.potentialFutureExposure.value)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replacement Cost Details */}
      <div>
        <h3 className="text-lg font-medium mb-2">Replacement Cost Details</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Current Market Value (V)</TableCell>
              <TableCell className="text-right">
                {formatNumber(result.replacementCost.currentMarketValue)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Collateral (C)</TableCell>
              <TableCell className="text-right">
                {formatNumber(result.replacementCost.collateral)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Threshold Amount (TH)</TableCell>
              <TableCell className="text-right">
                {formatNumber(result.replacementCost.thresholdAmount)}
              </TableCell>
            </TableRow>
            {result.replacementCost.marginType === 'MARGINED' && (
              <>
                <TableRow>
                  <TableCell>Minimum Transfer Amount (MTA)</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(
                      result.replacementCost.minimumTransferAmount || 0
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Independent Collateral Amount (ICA)</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(
                      result.replacementCost.independentCollateralAmount || 0
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Variation Margin (VM)</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(result.replacementCost.variationMargin || 0)}
                  </TableCell>
                </TableRow>
              </>
            )}
            <TableRow className="font-medium">
              <TableCell>Total Replacement Cost</TableCell>
              <TableCell className="text-right">
                {formatNumber(result.replacementCost.value)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* PFE Details */}
      <div>
        <h3 className="text-lg font-medium mb-2">
          Potential Future Exposure Details
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Aggregate Add-On</TableCell>
              <TableCell className="text-right">
                {formatNumber(result.potentialFutureExposure.aggregateAddOn)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Multiplier</TableCell>
              <TableCell className="text-right">
                {result.potentialFutureExposure.multiplier.toFixed(4)}
              </TableCell>
            </TableRow>
            <TableRow className="font-medium">
              <TableCell>Total PFE</TableCell>
              <TableCell className="text-right">
                {formatNumber(result.potentialFutureExposure.value)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Input Summary */}
      <div>
        <h3 className="text-lg font-medium mb-2">Input Summary</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parameter</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Netting Set</TableCell>
              <TableCell>{result.inputSummary.nettingSetId}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Margin Type</TableCell>
              <TableCell>{result.inputSummary.marginType}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Number of Trades</TableCell>
              <TableCell>{result.inputSummary.tradeCount}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Asset Classes</TableCell>
              <TableCell>
                {result.inputSummary.assetClasses.join(', ')}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Total Notional</TableCell>
              <TableCell>
                {formatNumber(result.inputSummary.totalNotional)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
