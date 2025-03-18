'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import formSchema from '@/lib/saccr/schema';
import {
  AssetClass,
  MarginType,
  PositionType,
  TransactionType,
  SACCRResult,
} from '@/lib/saccr/types';
import { Form } from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import NettingSetForm from './netting-set-form';
import TradeForm from './trade-form';
import CollateralForm from './collateral-form';
import ResultDisplay from './result-display';
import CSVUploadForm from './csv-upload-form';

// Use the inferred type from the Zod schema
export type FormDataType = z.infer<typeof formSchema>;

export default function SACCRForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [result, setResult] = useState<SACCRResult | null>(null);

  // Use a type parameter to fix the resolver type compatibility issue
  const form = useForm<FormDataType>({
    resolver: zodResolver<FormDataType>(formSchema),
    defaultValues: {
      nettingSet: {
        nettingAgreementId: '',
        marginType: MarginType.UNMARGINED,
        thresholdAmount: 0,
        minimumTransferAmount: 0,
        independentCollateralAmount: 0,
        variationMargin: 0,
        marginPeriodOfRisk: 10,
      },
      trade: {
        id: '',
        assetClass: AssetClass.INTEREST_RATE,
        transactionType: TransactionType.LINEAR,
        positionType: PositionType.LONG,
        notionalAmount: 0,
        currency: 'USD',
        maturityDate: '',
        startDate: new Date().toISOString().split('T')[0],
        currentMarketValue: 0,
        // Add default values for asset-class specific fields
        referenceCurrency: 'USD',
        paymentFrequency: 3,
        resetFrequency: 3,
        indexName: '',
        basis: '',
      },
      collateral: [
        {
          collateralAmount: 0,
          collateralCurrency: 'USD',
          haircut: 0,
        },
      ],
    },
  });

  const assetClass = form.watch('trade.assetClass');

  // Reset asset-class specific fields when asset class changes
  const onAssetClassChange = (value: AssetClass) => {
    form.setValue('trade.assetClass', value);

    // Clear asset-class specific fields
    const commonFields = [
      'id',
      'assetClass',
      'transactionType',
      'positionType',
      'notionalAmount',
      'currency',
      'maturityDate',
      'startDate',
      'currentMarketValue',
    ];

    // Keep only common fields and reset the rest
    const currentValues = form.getValues('trade');
    const newValues: Record<
      string,
      string | number | AssetClass | TransactionType | PositionType
    > = {};

    commonFields.forEach((field) => {
      const value = currentValues[field as keyof typeof currentValues];
      if (value !== undefined) {
        newValues[field] = value;
      }
    });

    // Add default values for asset-class specific fields based on the selected asset class
    switch (value) {
      case AssetClass.INTEREST_RATE:
        newValues.referenceCurrency = 'USD';
        newValues.paymentFrequency = 3;
        newValues.resetFrequency = 3;
        newValues.indexName = '';
        newValues.basis = '';
        break;
      case AssetClass.FOREIGN_EXCHANGE:
        newValues.currencyPair = `${currentValues.currency}/USD`;
        newValues.settlementDate = currentValues.maturityDate;
        break;
      case AssetClass.CREDIT:
        newValues.referenceEntity = '';
        newValues.seniority = 'SENIOR';
        newValues.sector = 'CORPORATE';
        newValues.creditQuality = '';
        break;
      case AssetClass.EQUITY:
        newValues.issuer = '';
        newValues.market = 'DEFAULT';
        newValues.sector = 'DEFAULT';
        break;
      case AssetClass.COMMODITY:
        newValues.commodityType = '';
        newValues.subType = 'DEFAULT';
        break;
    }

    form.reset({
      ...form.getValues(),
      trade: newValues,
    });
  };

  // Define the onSubmit handler with the correct type
  const onSubmit = async (data: FormDataType) => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // Convert form data to the format expected by the API
      const formattedData = {
        nettingSet: {
          ...data.nettingSet,
          thresholdAmount: data.nettingSet.thresholdAmount.toString(),
          minimumTransferAmount: data.nettingSet.minimumTransferAmount.toString(),
          independentCollateralAmount: data.nettingSet.independentCollateralAmount.toString(),
          variationMargin: data.nettingSet.variationMargin.toString(),
          marginPeriodOfRisk: data.nettingSet.marginPeriodOfRisk.toString(),
        },
        trade: {
          ...data.trade,
          notionalAmount: data.trade.notionalAmount.toString(),
          currentMarketValue: data.trade.currentMarketValue.toString(),
          // Include asset-class specific fields if they exist
          ...(data.trade.assetClass === AssetClass.INTEREST_RATE && {
            paymentFrequency: (data.trade as { paymentFrequency?: number }).paymentFrequency?.toString() || "3",
            resetFrequency: (data.trade as { resetFrequency?: number }).resetFrequency?.toString() || "3",
          }),
        },
        collateral: data.collateral.map(item => ({
          ...item,
          collateralAmount: item.collateralAmount.toString(),
          haircut: item.haircut.toString(),
        })),
      };

      const response = await fetch('/api/calculate/saccr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate SACCR');
      }

      const responseData = await response.json();
      
      if (responseData.success && responseData.result) {
        setResult(responseData.result);
        toast.success('SACCR calculation completed successfully');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error calculating SACCR:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to calculate SACCR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCSVResult = (calculationResult: SACCRResult) => {
    setResult(calculationResult);
    toast.success('SACCR calculation from CSV completed successfully');
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>SACCR Calculator</CardTitle>
          <CardDescription>
            Calculate Standardized Approach for Counterparty Credit Risk
            (SA-CCR) exposure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <NettingSetForm form={form} />
                      <CollateralForm form={form} className="mt-6" />
                    </div>
                    <div>
                      <TradeForm
                        form={form}
                        assetClass={assetClass}
                        onAssetClassChange={onAssetClassChange}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Calculating...' : 'Calculate SACCR'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="csv">
              <CSVUploadForm onResult={handleCSVResult} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {result && (
        <Card className="w-full mt-6">
          <CardHeader>
            <CardTitle>SACCR Calculation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultDisplay result={result} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
