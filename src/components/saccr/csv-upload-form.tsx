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
import { SACCRResult } from '@/lib/saccr/types';
import { toast } from 'sonner';
import { AlertCircle, FileText, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CSVUploadFormProps {
  onResult: (result: SACCRResult) => void;
}

export default function CSVUploadForm({ onResult }: CSVUploadFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/calculate/saccr', {
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
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
      toast.error(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
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
      'id,assetClass,transactionType,positionType,notionalAmount,currency,maturityDate,startDate,currentMarketValue,nettingAgreementId,marginType',
      'TRADE001,INTEREST_RATE,LINEAR,LONG,1000000,USD,2025-12-31,2023-01-01,0,NETTING001,UNMARGINED',
      'TRADE002,FOREIGN_EXCHANGE,LINEAR,SHORT,500000,EUR,2024-06-30,2023-01-01,-5000,NETTING001,UNMARGINED',
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'saccr_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('CSV template downloaded');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload CSV File</CardTitle>
          <CardDescription>
            Upload a CSV file containing trade data for batch SACCR calculation
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
              type="submit"
              className="flex-1"
              disabled={!file || isLoading}
            >
              {isLoading ? 'Processing...' : 'Calculate SACCR'}
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
            <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
              <li>First row must be a header with column names</li>
              <li>
                Required columns: id, assetClass, transactionType, positionType,
                notionalAmount, currency, maturityDate
              </li>
              <li>
                Optional columns: startDate, currentMarketValue,
                nettingAgreementId, marginType
              </li>
              <li>
                Asset class specific columns may be required based on the asset
                class
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
