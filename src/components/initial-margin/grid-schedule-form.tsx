"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gridScheduleFormSchema } from '@/lib/initial-margin/schema';
import { AssetClass, MarginType } from '@/lib/saccr/types';
import { MaturityBucket } from '@/lib/initial-margin/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Upload } from 'lucide-react';
import { GridScheduleResult, GridScheduleFormInput } from '@/lib/initial-margin/types';
import GridScheduleNettingSetForm from './grid-schedule-netting-set-form';

export default function GridScheduleForm() {
  const [activeTab, setActiveTab] = useState('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GridScheduleResult | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(gridScheduleFormSchema),
    defaultValues: {
      nettingSet: {
        nettingAgreementId: '',
        marginType: MarginType.UNMARGINED,
        thresholdAmount: '',
        minimumTransferAmount: '',
      },
      trades: [
        {
          id: `trade-${Math.random().toString(36).substr(2, 9)}`,
          assetClass: AssetClass.INTEREST_RATE,
          notionalAmount: '',
          currency: 'USD',
          maturityDate: new Date().toISOString().split('T')[0],
          startDate: new Date().toISOString().split('T')[0],
          maturityBucket: MaturityBucket.ONE_TO_FIVE_YEARS,
        },
      ],
      collateral: [],
    },
  });

  // Setup field arrays for trades and collateral
  const { fields: tradeFields, append: appendTrade, remove: removeTrade } = useFieldArray({
    control: form.control,
    name: 'trades',
  });

  const { fields: collateralFields, append: appendCollateral, remove: removeCollateral } = useFieldArray({
    control: form.control,
    name: 'collateral',
  });

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof gridScheduleFormSchema>) => {
    setIsLoading(true);
    try {
      // Transform form data to match expected types
      const transformedData: GridScheduleFormInput = {
        nettingSet: {
          nettingAgreementId: data.nettingSet.nettingAgreementId,
          marginType: data.nettingSet.marginType,
          thresholdAmount: data.nettingSet.thresholdAmount ? parseFloat(String(data.nettingSet.thresholdAmount)) : undefined,
          minimumTransferAmount: data.nettingSet.minimumTransferAmount ? parseFloat(String(data.nettingSet.minimumTransferAmount)) : undefined,
        },
        trades: data.trades.map((trade) => ({
          id: trade.id || `trade-${Math.random().toString(36).substr(2, 9)}`,
          assetClass: trade.assetClass,
          notionalAmount: parseFloat(String(trade.notionalAmount)),
          currency: trade.currency,
          maturityDate: trade.maturityDate,
          startDate: trade.startDate,
          maturityBucket: trade.maturityBucket,
        })),
        collateral: data.collateral?.map((coll) => ({
          collateralAmount: parseFloat(String(coll.value)),
          collateralCurrency: coll.assetClass, // Using assetClass as currency since that's what the schema has
          haircut: undefined, // Optional field
        })) || [],
      };

      const response = await fetch('/api/calculate/initial-margin/grid-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to calculate Initial Margin');
      }

      setResult(responseData.result);
      toast.success('Initial Margin calculated successfully');
    } catch (error) {
      console.error('Error calculating Initial Margin:', error);
      toast.error('Failed to calculate Initial Margin');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle CSV upload
  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('nettingAgreementId', form.getValues('nettingSet.nettingAgreementId'));
    formData.append('marginType', form.getValues('nettingSet.marginType'));
    
    if (form.getValues('nettingSet.thresholdAmount')) {
      formData.append('thresholdAmount', String(form.getValues('nettingSet.thresholdAmount')));
    }
    
    if (form.getValues('nettingSet.minimumTransferAmount')) {
      formData.append('minimumTransferAmount', String(form.getValues('nettingSet.minimumTransferAmount')));
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/calculate/initial-margin/grid-schedule', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to calculate Initial Margin');
      }

      setResult(responseData.result);
      toast.success('Initial Margin calculated successfully');
    } catch (error) {
      console.error('Error calculating Initial Margin:', error);
      toast.error('Failed to calculate Initial Margin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Input</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4 mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Netting Set Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Netting Set Information</CardTitle>
                  <CardDescription>
                    Enter information about the netting set
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GridScheduleNettingSetForm form={form} />
                </CardContent>
              </Card>

              {/* Trades Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Trades</CardTitle>
                    <CardDescription>
                      Add trades to calculate initial margin
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendTrade({
                        id: `trade-${Math.random().toString(36).substr(2, 9)}`,
                        assetClass: AssetClass.INTEREST_RATE,
                        notionalAmount: '',
                        currency: 'USD',
                        maturityDate: new Date().toISOString().split('T')[0],
                        startDate: new Date().toISOString().split('T')[0],
                        maturityBucket: MaturityBucket.ONE_TO_FIVE_YEARS,
                      })
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Trade
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {tradeFields && tradeFields.length > 0 ? (
                      tradeFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md relative">
                          <div className="absolute right-2 top-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTrade(index)}
                              disabled={tradeFields.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <h3 className="font-medium mb-4">Trade {index + 1}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Asset Class */}
                            <FormField
                              control={form.control}
                              name={`trades.${index}.assetClass`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Asset Class</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select asset class" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value={AssetClass.INTEREST_RATE}>
                                        Interest Rate
                                      </SelectItem>
                                      <SelectItem value={AssetClass.CREDIT}>
                                        Credit
                                      </SelectItem>
                                      <SelectItem value={AssetClass.EQUITY}>
                                        Equity
                                      </SelectItem>
                                      <SelectItem value={AssetClass.COMMODITY}>
                                        Commodity
                                      </SelectItem>
                                      <SelectItem value={AssetClass.FOREIGN_EXCHANGE}>
                                        Foreign Exchange
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Notional Amount */}
                            <FormField
                              control={form.control}
                              name={`trades.${index}.notionalAmount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notional Amount</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Enter notional amount"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Currency */}
                            <FormField
                              control={form.control}
                              name={`trades.${index}.currency`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Currency</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter currency (e.g., USD)"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Maturity Date */}
                            <FormField
                              control={form.control}
                              name={`trades.${index}.maturityDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Maturity Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Maturity Bucket */}
                            <FormField
                              control={form.control}
                              name={`trades.${index}.maturityBucket`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Maturity Bucket</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select maturity bucket" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value={MaturityBucket.LESS_THAN_ONE_YEAR}>
                                        Less than 1 year
                                      </SelectItem>
                                      <SelectItem value={MaturityBucket.ONE_TO_FIVE_YEARS}>
                                        1 to 5 years
                                      </SelectItem>
                                      <SelectItem value={MaturityBucket.GREATER_THAN_FIVE_YEARS}>
                                        Greater than 5 years
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No trades added. Click &quot;Add Trade&quot; to add trade information.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Collateral Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Collateral</CardTitle>
                    <CardDescription>
                      Add collateral information (optional)
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendCollateral({
                        assetClass: AssetClass.INTEREST_RATE,
                        value: 0
                      })
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Collateral
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {collateralFields.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No collateral added. Click &quot;Add Collateral&quot; to add collateral information.
                      </div>
                    )}
                    
                    {collateralFields?.map((field, index) => (
                      <Card key={field.id} className="mb-4">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-md">Collateral {index + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCollateral(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`collateral.${index}.assetClass`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Asset Class</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select asset class" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.values(AssetClass).map((assetClass) => (
                                      <SelectItem key={assetClass} value={assetClass}>
                                        {assetClass}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`collateral.${index}.value`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Value</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter value"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    )) || null}
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Calculating...' : 'Calculate Initial Margin'}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="csv" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>CSV Upload</CardTitle>
              <CardDescription>
                Upload a CSV file with trade data to calculate initial margin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCsvUpload} className="space-y-6">
                {/* Netting Set Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Netting Set Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nettingAgreementId">Netting Agreement ID</Label>
                      <Input
                        id="nettingAgreementId"
                        placeholder="Enter netting agreement ID"
                        {...form.register('nettingSet.nettingAgreementId')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marginType">Margin Type</Label>
                      <Select
                        onValueChange={(value) => form.setValue('nettingSet.marginType', value as MarginType)}
                        defaultValue={form.getValues('nettingSet.marginType')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select margin type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={MarginType.MARGINED}>Margined</SelectItem>
                          <SelectItem value={MarginType.UNMARGINED}>Unmargined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thresholdAmount">Threshold Amount</Label>
                      <Input
                        id="thresholdAmount"
                        type="number"
                        placeholder="Enter threshold amount"
                        {...form.register('nettingSet.thresholdAmount')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minimumTransferAmount">Minimum Transfer Amount</Label>
                      <Input
                        id="minimumTransferAmount"
                        type="number"
                        placeholder="Enter minimum transfer amount"
                        {...form.register('nettingSet.minimumTransferAmount')}
                      />
                    </div>
                  </div>
                </div>

                {/* CSV File Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Upload CSV File</h3>
                  <div className="border-2 border-dashed rounded-md p-6 text-center">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="csv-upload"
                    />
                    <Label
                      htmlFor="csv-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <span className="text-lg font-medium">
                        {csvFile ? csvFile.name : 'Click to upload CSV file'}
                      </span>
                      <span className="text-sm text-muted-foreground mt-1">
                        CSV file should contain trade data with headers
                      </span>
                    </Label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isLoading || !csvFile}>
                  {isLoading ? 'Calculating...' : 'Calculate Initial Margin'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Initial Margin Calculation Results</CardTitle>
            <CardDescription>
              Grid/Schedule Approach (BCBS-IOSCO)
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

              {/* Asset Class Breakdown */}
              <div>
                <h3 className="text-lg font-medium mb-4">Asset Class Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(result.components).map(([assetClass, value]) => (
                    <div key={assetClass} className="flex justify-between items-center">
                      <span>{assetClass.replace('_', ' ')}</span>
                      <span className="font-medium">{value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Maturity Bucket Breakdown */}
              <div>
                <h3 className="text-lg font-medium mb-4">Maturity Bucket Breakdown</h3>
                {Object.entries(result.grossNotionalByAssetClass).map(([assetClass, buckets]) => (
                  <div key={assetClass} className="mb-4">
                    <h4 className="font-medium mb-2">{assetClass.replace('_', ' ')}</h4>
                    <div className="space-y-2 pl-4">
                      {Object.entries(buckets).map(([bucket, notional]) => (
                        <div key={bucket} className="flex justify-between items-center">
                          <span>
                            {bucket === MaturityBucket.LESS_THAN_ONE_YEAR
                              ? 'Less than 1 year'
                              : bucket === MaturityBucket.ONE_TO_FIVE_YEARS
                              ? '1 to 5 years'
                              : 'Greater than 5 years'}
                          </span>
                          <span>{notional.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
