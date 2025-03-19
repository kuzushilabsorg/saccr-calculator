"use client";

import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { VaRFormSchemaType } from '@/lib/var/schema';
import {
  VaRTimeHorizon,
  VaRConfidenceLevel,
  VaRCalculationMethod,
  VaRAssetType,
} from '@/lib/var/types';
import { marketDataProviders } from '@/lib/var/market-data-service';

interface VaRParametersFormProps {
  form: UseFormReturn<VaRFormSchemaType>;
}

/**
 * VaR Parameters Form Component
 * 
 * This component provides form fields for VaR calculation parameters.
 */
export function VaRParametersForm({ form }: VaRParametersFormProps) {
  const [useExternalData, setUseExternalData] = useState(form.getValues().useExternalData || false);
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<VaRAssetType[]>([]);
  const [availableProviders, setAvailableProviders] = useState(marketDataProviders);

  // Watch for changes in positions to update available providers
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith('positions') && name.includes('assetType')) {
        updateSelectedAssetTypes();
      }
    });

    // Initial update
    updateSelectedAssetTypes();

    return () => subscription.unsubscribe();
  }, [form]);

  // Update the list of selected asset types from the form
  const updateSelectedAssetTypes = () => {
    const positions = form.getValues().positions || [];
    const assetTypes = positions.map(p => p.assetType).filter((v, i, a) => a.indexOf(v) === i);
    setSelectedAssetTypes(assetTypes);
    
    // Filter providers that support all selected asset types
    const filteredProviders = marketDataProviders.filter(provider => 
      assetTypes.every(assetType => 
        provider.supportedAssetTypes.includes(assetType)
      )
    );
    
    setAvailableProviders(filteredProviders.length > 0 ? filteredProviders : marketDataProviders);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Time Horizon */}
      <FormField
        control={form.control}
        name="parameters.timeHorizon"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Time Horizon</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select time horizon" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={VaRTimeHorizon.ONE_DAY}>1 Day</SelectItem>
                <SelectItem value={VaRTimeHorizon.TEN_DAYS}>10 Days</SelectItem>
                <SelectItem value={VaRTimeHorizon.ONE_MONTH}>1 Month</SelectItem>
                <SelectItem value={VaRTimeHorizon.THREE_MONTHS}>3 Months</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              The time period over which to calculate potential losses.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Confidence Level */}
      <FormField
        control={form.control}
        name="parameters.confidenceLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Confidence Level</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select confidence level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={VaRConfidenceLevel.NINETY_PERCENT}>90%</SelectItem>
                <SelectItem value={VaRConfidenceLevel.NINETY_FIVE_PERCENT}>95%</SelectItem>
                <SelectItem value={VaRConfidenceLevel.NINETY_SEVEN_POINT_FIVE_PERCENT}>97.5%</SelectItem>
                <SelectItem value={VaRConfidenceLevel.NINETY_NINE_PERCENT}>99%</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              The probability that losses will not exceed the VaR estimate.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Calculation Method */}
      <FormField
        control={form.control}
        name="parameters.calculationMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Calculation Method</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select calculation method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={VaRCalculationMethod.HISTORICAL_SIMULATION}>
                  Historical Simulation
                </SelectItem>
                <SelectItem value={VaRCalculationMethod.MONTE_CARLO_SIMULATION}>
                  Monte Carlo Simulation
                </SelectItem>
                <SelectItem value={VaRCalculationMethod.PARAMETRIC}>
                  Parametric (Variance-Covariance)
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              The method used to calculate VaR.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Lookback Period */}
      <FormField
        control={form.control}
        name="parameters.lookbackPeriod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lookback Period (Days)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="30"
                max="1000"
                placeholder="252"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 252)}
              />
            </FormControl>
            <FormDescription>
              Number of historical days to include in the calculation.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Include Correlations */}
      <FormField
        control={form.control}
        name="parameters.includeCorrelations"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Include Correlations</FormLabel>
              <FormDescription>
                Account for correlations between assets in the portfolio.
              </FormDescription>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Use External Data */}
      <FormField
        control={form.control}
        name="useExternalData"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  setUseExternalData(!!checked);
                }}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Use External Market Data</FormLabel>
              <FormDescription>
                Fetch historical market data from external sources.
              </FormDescription>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Data Source - only shown when useExternalData is true */}
      {useExternalData && (
        <FormField
          control={form.control}
          name="dataSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Source</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The source of historical market data.
                {availableProviders.length < marketDataProviders.length && (
                  <span className="text-yellow-600 block mt-1">
                    Note: Only showing providers that support all selected asset types.
                  </span>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
