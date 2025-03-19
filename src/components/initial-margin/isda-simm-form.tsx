"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isdaSimmFormSchema } from '@/lib/initial-margin/schema';
import { AssetClass, MarginType } from '@/lib/saccr/types';
import { RiskFactorType, ISDASIMMResult, ISDASIMMFormInput } from '@/lib/initial-margin/types';
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
import { toast } from 'sonner';
import { PlusCircle, Trash2, Upload } from 'lucide-react';
import ISDASIMMNettingSetForm from './isda-simm-netting-set-form';
import ISDASIMMTradeForm from '../initial-margin/isda-simm-trade-form';
import ISDASIMMResults from '../initial-margin/isda-simm-results';

export default function ISDASIMMForm() {
  const [activeTab, setActiveTab] = useState('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ISDASIMMResult | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(isdaSimmFormSchema),
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
          riskFactors: [
            {
              type: RiskFactorType.INTEREST_RATE,
              bucket: 1,
              label: 'IR Risk',
              value: 1,
            },
          ],
          sensitivityValue: '',
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
  const onSubmit = async (data: z.infer<typeof isdaSimmFormSchema>) => {
    setIsLoading(true);
    try {
      // Transform form data to match expected types
      const transformedData: ISDASIMMFormInput = {
        nettingSet: {
          nettingAgreementId: data.nettingSet.nettingAgreementId,
          marginType: data.nettingSet.marginType,
          thresholdAmount: data.nettingSet.thresholdAmount ? parseFloat(String(data.nettingSet.thresholdAmount)) : undefined,
          minimumTransferAmount: data.nettingSet.minimumTransferAmount ? parseFloat(String(data.nettingSet.minimumTransferAmount)) : undefined,
        },
        trades: data.trades.map((trade: z.infer<typeof isdaSimmFormSchema>['trades'][number]) => ({
          id: trade.id || `trade-${Math.random().toString(36).substr(2, 9)}`,
          assetClass: trade.assetClass,
          notionalAmount: parseFloat(String(trade.notionalAmount)),
          currency: trade.currency,
          maturityDate: trade.maturityDate,
          startDate: trade.startDate,
          riskFactors: trade.riskFactors.map((rf: z.infer<typeof isdaSimmFormSchema>['trades'][number]['riskFactors'][number]) => ({
            type: rf.type,
            bucket: rf.bucket,
            label: rf.label,
            value: rf.value,
          })),
          sensitivityValue: parseFloat(String(trade.sensitivityValue)),
        })),
        collateral: data.collateral ? data.collateral.map((coll) => ({
          collateralAmount: parseFloat(String(coll.value)),
          collateralCurrency: coll.assetClass,
          haircut: undefined,
        })) : [],
      };

      const response = await fetch('/api/calculate/initial-margin/isda-simm', {
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
    
    const thresholdAmount = form.getValues('nettingSet.thresholdAmount');
    if (thresholdAmount) {
      formData.append('thresholdAmount', thresholdAmount.toString());
    }
    
    const minimumTransferAmount = form.getValues('nettingSet.minimumTransferAmount');
    if (minimumTransferAmount) {
      formData.append('minimumTransferAmount', minimumTransferAmount.toString());
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/calculate/initial-margin/isda-simm', {
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
                  <CardTitle>Netting Set</CardTitle>
                </CardHeader>
                <CardContent>
                  <ISDASIMMNettingSetForm form={form} />
                </CardContent>
              </Card>

              {/* Trades Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Trades</CardTitle>
                    <CardDescription>
                      Add trades with risk factor sensitivities
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
                        riskFactors: [
                          {
                            type: RiskFactorType.INTEREST_RATE,
                            bucket: 1,
                            label: 'IR Risk',
                            value: 1,
                          },
                        ],
                        sensitivityValue: '',
                      })
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Trade
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {tradeFields.map((field, index) => (
                      <ISDASIMMTradeForm
                        key={field.id}
                        form={form}
                        index={index}
                        onRemove={() => removeTrade(index)}
                        canRemove={tradeFields.length > 1}
                      />
                    ))}
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
                        value: 0,
                        assetClass: 'USD',
                        haircut: undefined,
                      })
                    }
                    className="mt-2"
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
                    
                    {collateralFields.map((field, index) => (
                      <div key={field.id} className="space-y-4 p-4 border rounded-md relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => removeCollateral(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <FormField
                          control={form.control}
                          name={`collateral.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Collateral Amount</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter collateral amount"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`collateral.${index}.assetClass`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Collateral Currency</FormLabel>
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
                        
                        <FormField
                          control={form.control}
                          name={`collateral.${index}.haircut`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Haircut (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter haircut percentage"
                                  {...field}
                                  onChange={(e) => 
                                    field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
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

        <TabsContent value="results" className="space-y-4">
          {result ? (
            <ISDASIMMResults 
              result={result} 
              formData={form.getValues() as unknown as ISDASIMMFormInput} 
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground">
                Submit the form to see results
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Results Section */}
    </div>
  );
}
