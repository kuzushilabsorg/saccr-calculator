"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash } from 'lucide-react';
import { VaRParametersForm } from './var-parameters-form';
import { VaRPositionForm } from './var-position-form';
import { VaRResults } from './var-results';
import { varFormSchema, VaRFormSchemaType } from '@/lib/var/schema';
import { VaRAssetType, VaRCalculationMethod, VaRTimeHorizon, VaRConfidenceLevel, VaRResult } from '@/lib/var/types';

/**
 * Main form component for the Historical VaR calculator.
 * Handles form state, validation, and submission.
 */
export function VaRForm() {
  const [results, setResults] = useState<VaRResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<VaRFormSchemaType>({
    resolver: zodResolver(varFormSchema),
    defaultValues: {
      parameters: {
        confidenceLevel: VaRConfidenceLevel.NINETY_FIVE_PERCENT,
        timeHorizon: VaRTimeHorizon.TEN_DAYS,
        calculationMethod: VaRCalculationMethod.HISTORICAL_SIMULATION,
        lookbackPeriod: 252,
        includeCorrelations: true,
      },
      positions: [
        {
          id: uuidv4(),
          assetType: VaRAssetType.EQUITY,
          assetIdentifier: "",
          quantity: 0,
          currentPrice: 0,
          currency: 'USD',
        },
      ],
      useExternalData: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'positions',
  });

  const addPosition = () => {
    append({
      id: uuidv4(),
      assetType: VaRAssetType.EQUITY,
      assetIdentifier: "",
      quantity: 0,
      currentPrice: 0,
      currency: 'USD',
    });
  };

  const onSubmit = async (data: VaRFormSchemaType) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/calculate/var', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate VaR');
      }

      const result = await response.json();
      setResults(result);
    } catch (error) {
      console.error('Error calculating VaR:', error);
      toast.error('Failed to calculate VaR. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="parameters" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="parameters">Parameters</TabsTrigger>
                    <TabsTrigger value="positions">Positions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="parameters" className="pt-4">
                    <VaRParametersForm form={form} />
                  </TabsContent>
                  <TabsContent value="positions" className="pt-4">
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="relative">
                          <VaRPositionForm
                            form={form}
                            index={index}
                          />
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-3 right-3"
                              onClick={() => remove(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={addPosition}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Position
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Calculating...' : 'Calculate VaR'}
            </Button>
          </div>
        </form>
      </Form>

      {results && <VaRResults results={results} />}
    </div>
  );
}
