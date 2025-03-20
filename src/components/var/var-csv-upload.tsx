'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, FileText, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { VaRResult } from '@/lib/var/types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface VaRCsvUploadProps {
  onResult: (result: VaRResult) => void;
  onError: (error: string) => void;
}

export function VaRCsvUpload({ onResult, onError }: VaRCsvUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    if (selectedFile && !selectedFile.name.endsWith('.csv')) {
      setError('Only CSV files are supported');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/calculate/var', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process CSV file');
      }

      if (data.success && data.result) {
        onResult(data.result);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('CSV upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const droppedFile = e.dataTransfer.files?.[0] || null;

    if (droppedFile && !droppedFile.name.endsWith('.csv')) {
      setError('Only CSV files are supported');
      return;
    }

    setFile(droppedFile);
    setError(null);
  };

  const handleDownloadTemplate = () => {
    // Create CSV template content
    const templateContent = [
      'date,assetIdentifier,assetType,price,currency',
      '2023-01-03,AAPL,EQUITY,125.07,USD',
      '2023-01-04,AAPL,EQUITY,126.36,USD',
      '2023-01-05,AAPL,EQUITY,125.02,USD',
      '2023-01-06,AAPL,EQUITY,129.62,USD',
      '2023-01-09,AAPL,EQUITY,130.15,USD',
      '2023-01-10,AAPL,EQUITY,130.73,USD',
      '2023-01-11,AAPL,EQUITY,133.49,USD',
      '2023-01-12,AAPL,EQUITY,133.41,USD',
      '2023-01-13,AAPL,EQUITY,134.76,USD',
      '2023-01-17,AAPL,EQUITY,135.94,USD',
      '2023-01-18,AAPL,EQUITY,135.21,USD',
      '2023-01-19,AAPL,EQUITY,135.27,USD',
      '2023-01-20,AAPL,EQUITY,137.87,USD',
      // Add more sample data...
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'var_historical_data_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('CSV template downloaded');
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Historical Price Data</CardTitle>
          <CardDescription>
            Upload a CSV file containing historical price data to calculate Value at Risk (VaR)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="h-10 w-10 text-gray-400" />
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {file
                    ? file.name
                    : 'Drag and drop your CSV file here or click to browse'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  (Only .csv files are accepted)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2"
              >
                Browse Files
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button
              type="button"
              className="flex-1"
              disabled={!file || isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Processing...</span>
                </div>
              ) : (
                'Calculate VaR'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadTemplate}
              className="flex items-center justify-center"
            >
              <FileText className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            <p className="font-medium">CSV Format Requirements:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                <strong>Headers:</strong> date, assetIdentifier, assetType, price, currency
              </li>
              <li>
                <strong>Date format:</strong> YYYY-MM-DD (e.g., 2023-01-15)
              </li>
              <li>
                <strong>Asset types:</strong> EQUITY, FOREIGN_EXCHANGE, INTEREST_RATE, COMMODITY, CRYPTO
              </li>
              <li>
                <strong>Price:</strong> Numeric value (e.g., 150.75)
              </li>
              <li>
                <strong>Currency:</strong> 3-letter code (e.g., USD, EUR)
              </li>
            </ul>
            <p className="mt-2">
              <strong>Note:</strong> For accurate VaR calculation, include at least 252 trading days (1 year) of historical data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
