"use client";

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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash as TrashIcon } from 'lucide-react';
import { VaRFormSchemaType } from '@/lib/var/schema';
import { VaRAssetType } from '@/lib/var/types';

/**
 * Props for the VaR Position Form component
 */
interface VaRPositionFormProps {
  form: UseFormReturn<VaRFormSchemaType>;
  index: number;
  onRemove?: () => void;
}

/**
 * VaR Position Form Component
 * 
 * This component provides form fields for a portfolio position.
 */
export function VaRPositionForm({ form, index, onRemove }: VaRPositionFormProps) {
  // Currency options
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'];

  // Helper functions to provide context-sensitive guidance for asset identifiers
  function getAssetIdentifierPlaceholder(assetType: VaRAssetType): string {
    switch (assetType) {
      case VaRAssetType.EQUITY:
        return 'AAPL';
      case VaRAssetType.FOREIGN_EXCHANGE:
        return 'EUR_USD';
      case VaRAssetType.INTEREST_RATE:
        return 'DFF';
      case VaRAssetType.COMMODITY:
        return 'GOLD';
      case VaRAssetType.CRYPTO:
        return 'bitcoin';
      default:
        return '';
    }
  }

  function getAssetIdentifierDescription(assetType: VaRAssetType): string {
    switch (assetType) {
      case VaRAssetType.EQUITY:
        return 'Enter the stock ticker symbol (e.g., AAPL for Apple Inc.)';
      case VaRAssetType.FOREIGN_EXCHANGE:
        return 'Enter the currency pair in FORMAT_TO format (e.g., EUR_USD)';
      case VaRAssetType.INTEREST_RATE:
        return 'Enter the FRED series ID (e.g., DFF for Federal Funds Rate)';
      case VaRAssetType.COMMODITY:
        return 'Enter the commodity identifier (e.g., GOLD, SILVER)';
      case VaRAssetType.CRYPTO:
        return 'Enter the cryptocurrency ID (e.g., bitcoin, ethereum)';
      default:
        return 'Enter the asset identifier';
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">Position {index + 1}</h4>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0"
            >
              <TrashIcon className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Asset Type */}
          <FormField
            control={form.control}
            name={`positions.${index}.assetType`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={VaRAssetType.EQUITY}>Equity</SelectItem>
                    <SelectItem value={VaRAssetType.FOREIGN_EXCHANGE}>Foreign Exchange</SelectItem>
                    <SelectItem value={VaRAssetType.INTEREST_RATE}>Interest Rate</SelectItem>
                    <SelectItem value={VaRAssetType.COMMODITY}>Commodity</SelectItem>
                    <SelectItem value={VaRAssetType.CRYPTO}>Cryptocurrency</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Asset Identifier */}
          <FormField
            control={form.control}
            name={`positions.${index}.assetIdentifier`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Identifier</FormLabel>
                <FormControl>
                  <Input placeholder={getAssetIdentifierPlaceholder(form.getValues(`positions.${index}.assetType`))} {...field} />
                </FormControl>
                <FormDescription>
                  {getAssetIdentifierDescription(form.getValues(`positions.${index}.assetType`))}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Quantity */}
          <FormField
            control={form.control}
            name={`positions.${index}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormDescription>
                  Number of units or notional amount
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Current Price */}
          <FormField
            control={form.control}
            name={`positions.${index}.currentPrice`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Price</FormLabel>
                <FormControl>
                  <Input type="number" step="any" min="0" {...field} />
                </FormControl>
                <FormDescription>
                  Current market price per unit
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Currency */}
          <FormField
            control={form.control}
            name={`positions.${index}.currency`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Purchase Date (Optional) */}
          <FormField
            control={form.control}
            name={`positions.${index}.purchaseDate`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Date (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    value={field.value ? (typeof field.value === 'string' ? field.value : field.value.toISOString().split('T')[0]) : ''} 
                  />
                </FormControl>
                <FormDescription>
                  Date when the position was acquired
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
