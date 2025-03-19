'use client';

import { UseFormReturn } from 'react-hook-form';
import { AssetClass, TransactionType, PositionType, OptionType } from '@/lib/saccr/types';
import { FormDataType } from './saccr-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface TradeFormProps {
  form: UseFormReturn<FormDataType>;
  assetClass: AssetClass;
  onAssetClassChange: (value: AssetClass) => void;
  className?: string;
}

export default function TradeForm({
  form,
  assetClass,
  onAssetClassChange,
  className = '',
}: TradeFormProps) {
  // Get the current transaction type to conditionally render option fields
  const transactionType = form.watch('trade.transactionType');
  const isOption = transactionType === TransactionType.OPTION;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Trade Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="trade.id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trade ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter trade ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trade.assetClass"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Class</FormLabel>
              <Select
                onValueChange={(value) =>
                  onAssetClassChange(value as AssetClass)
                }
                defaultValue={field.value?.toString()}
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
                  <SelectItem value={AssetClass.FOREIGN_EXCHANGE}>
                    Foreign Exchange
                  </SelectItem>
                  <SelectItem value={AssetClass.CREDIT}>Credit</SelectItem>
                  <SelectItem value={AssetClass.EQUITY}>Equity</SelectItem>
                  <SelectItem value={AssetClass.COMMODITY}>
                    Commodity
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trade.transactionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={TransactionType.LINEAR}>Linear</SelectItem>
                  <SelectItem value={TransactionType.OPTION}>Option</SelectItem>
                  <SelectItem value={TransactionType.BASIS}>Basis</SelectItem>
                  <SelectItem value={TransactionType.VOLATILITY}>
                    Volatility
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trade.positionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={PositionType.LONG}>Long</SelectItem>
                  <SelectItem value={PositionType.SHORT}>Short</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Option-specific fields - only shown when transaction type is OPTION */}
        {isOption && (
          <>
            <FormField
              control={form.control}
              name="trade.optionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Option Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={OptionType.CALL}>Call</SelectItem>
                      <SelectItem value={OptionType.PUT}>Put</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.strikePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strike Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter strike price"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.underlyingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Underlying Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter underlying price"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.volatility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volatility (as decimal, e.g., 0.2 for 20%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0.01"
                      max="1"
                      step="0.01"
                      placeholder="Enter volatility (default: 0.2)"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="trade.notionalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notional Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter notional amount"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trade.currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <Input placeholder="Enter currency (e.g., USD)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trade.maturityDate"
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

        <FormField
          control={form.control}
          name="trade.startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trade.currentMarketValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Market Value</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Asset class specific fields */}
        {assetClass === AssetClass.INTEREST_RATE && (
          <>
            <FormField
              control={form.control}
              name="trade.referenceCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Currency</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter reference currency" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.paymentFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Frequency (months)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" step="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.resetFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reset Frequency (months)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" step="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.indexName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Index Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter index name (e.g., LIBOR)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.basis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Basis</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter basis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {assetClass === AssetClass.FOREIGN_EXCHANGE && (
          <>
            <FormField
              control={form.control}
              name="trade.currencyPair"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency Pair</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter currency pair (e.g., USD/EUR)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.settlementDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Settlement Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {assetClass === AssetClass.CREDIT && (
          <>
            <FormField
              control={form.control}
              name="trade.referenceEntity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Entity</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter reference entity" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.seniority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seniority</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter seniority (e.g., SENIOR)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter sector (e.g., CORPORATE)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.creditQuality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Quality</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select credit quality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INVESTMENT_GRADE">
                        Investment Grade
                      </SelectItem>
                      <SelectItem value="SPECULATIVE_GRADE">
                        Speculative Grade
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.isIndex"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Is Index
                    </FormLabel>
                    <FormDescription>
                      Check if this is an index credit instrument
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </>
        )}

        {assetClass === AssetClass.EQUITY && (
          <>
            <FormField
              control={form.control}
              name="trade.issuer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issuer</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter issuer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.market"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter market" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sector" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {assetClass === AssetClass.COMMODITY && (
          <>
            <FormField
              control={form.control}
              name="trade.commodityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commodity Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select commodity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ELECTRICITY">Electricity</SelectItem>
                      <SelectItem value="OIL">Oil</SelectItem>
                      <SelectItem value="GAS">Gas</SelectItem>
                      <SelectItem value="METALS">Metals</SelectItem>
                      <SelectItem value="AGRICULTURAL">Agricultural</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade.subType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-Type</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sub-type" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
