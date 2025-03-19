"use client";

import { ISDASIMMResult, RiskFactorType, ISDASIMMFormInput } from '@/lib/initial-margin/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from "@/components/ui/separator";

interface ISDASIMMResultsProps {
  result: ISDASIMMResult;
  formData?: ISDASIMMFormInput;
}

export default function ISDASIMMResults({ result, formData }: ISDASIMMResultsProps) {
  // Helper function to format risk factor type for display
  const formatRiskFactorType = (type: RiskFactorType): string => {
    switch (type) {
      case RiskFactorType.INTEREST_RATE:
        return 'Interest Rate';
      case RiskFactorType.CREDIT_QUALIFYING:
        return 'Credit (Qualifying)';
      case RiskFactorType.CREDIT_NON_QUALIFYING:
        return 'Credit (Non-Qualifying)';
      case RiskFactorType.EQUITY:
        return 'Equity';
      case RiskFactorType.COMMODITY:
        return 'Commodity';
      case RiskFactorType.FX:
        return 'Foreign Exchange';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initial Margin Calculation Results</CardTitle>
        <CardDescription>
          ISDA SIMM Approach (Model-Based)
          {formData?.nettingSet?.nettingAgreementId && (
            <span className="block mt-1">
              Netting Agreement: {formData.nettingSet.nettingAgreementId}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/10 rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground">Total Initial Margin</h3>
              <p className="text-2xl font-bold">{result.initialMargin.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground">Net Initial Margin</h3>
              <p className="text-2xl font-bold">{result.netInitialMargin.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
            </div>
            {result.collateralValue !== undefined && (
              <div className="p-4 bg-muted rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground">Collateral Value</h3>
                <p className="text-2xl font-bold">{result.collateralValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Risk Factor Type Breakdown */}
          <div>
            <h3 className="text-lg font-medium mb-4">Risk Factor Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(result.components).map(([riskFactorType, value]) => (
                <div key={riskFactorType} className="flex justify-between items-center">
                  <span>{formatRiskFactorType(riskFactorType as RiskFactorType)}</span>
                  <span className="font-medium">{value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Risk Factor Details */}
          <div>
            <h3 className="text-lg font-medium mb-4">Risk Factor Details</h3>
            {Object.entries(result.riskFactorContributions).map(([riskFactorType, buckets]) => (
              <div key={riskFactorType} className="mb-4">
                <h4 className="font-medium mb-2">{formatRiskFactorType(riskFactorType as RiskFactorType)}</h4>
                <div className="space-y-2 pl-4">
                  {Object.entries(buckets).map(([bucket, contribution]) => (
                    <div key={bucket} className="flex justify-between items-center">
                      <span>Bucket {bucket}</span>
                      <span>{contribution.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Diversification Benefits */}
          {result.diversificationBenefit && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Diversification Benefits</h3>
                <div className="p-4 bg-muted rounded-md">
                  <div className="flex justify-between items-center">
                    <span>Total Diversification Benefit</span>
                    <span className="font-medium">{result.diversificationBenefit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Correlation Matrix */}
          {result.correlationMatrix && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Correlation Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk Factor</th>
                        {Object.keys(result.correlationMatrix).map((key) => (
                          <th key={key} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {formatRiskFactorType(key as RiskFactorType)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.correlationMatrix && Object.entries(result.correlationMatrix).map(([rowKey, rowValues], rowIndex) => (
                        <tr key={`row-${rowIndex}`}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                            {rowKey}
                          </td>
                          {Object.entries(rowValues).map(([colKey], colIndex) => (
                            <td key={`cell-${rowIndex}-${colIndex}`} className="px-4 py-2 whitespace-nowrap text-sm">
                              {(rowValues as Record<string, number>)[colKey].toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
