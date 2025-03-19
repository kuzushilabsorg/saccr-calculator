import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileSpreadsheet, AlertCircle, Upload } from "lucide-react";

interface CSVUploadProps {
  documentId: string;
  documentContent: string;
  onAnalysisComplete: (recommendations: Array<{
    type: "continue" | "review" | "terminate" | "other";
    description: string;
    riskLevel: "low" | "medium" | "high";
    reasoning: string;
  }>, summary: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function CSVUpload({ 
  documentId, 
  documentContent, 
  onAnalysisComplete, 
  isLoading, 
  setIsLoading 
}: CSVUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file to upload");
      return;
    }
    
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("csvFile", file);
      formData.append("documentId", documentId);
      formData.append("documentContent", documentContent);
      
      const response = await fetch("/api/vm-csa/analyze-csv", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze CSV data");
      }
      
      const data = await response.json();
      
      onAnalysisComplete(
        data.analysis.recommendations,
        data.analysis.summary
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Client CSV Data
        </CardTitle>
        <CardDescription>
          Upload the completed CSV file with client data for analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={triggerFileInput}
              className="w-full h-24 border-dashed flex flex-col gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span>
                {file ? file.name : "Click to select a CSV file"}
              </span>
            </Button>
          </div>
          
          {file && (
            <div className="text-sm text-muted-foreground">
              Selected file: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
          
          <div className="text-sm">
            <p className="text-muted-foreground">
              Please upload the CSV file that you filled with client data based on the template.
            </p>
            <p className="text-muted-foreground mt-1">
              Make sure all required fields are completed for accurate analysis.
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="w-full"
        >
          {isLoading ? "Analyzing Data..." : "Upload & Analyze Data"}
        </Button>
      </CardFooter>
    </Card>
  );
}
