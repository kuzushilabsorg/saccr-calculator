"use client";

import { useState } from "react";
import { DocumentUpload } from "@/components/vm-csa/document-upload";
import { CSVTemplate } from "@/components/vm-csa/csv-template";
import { CSVUpload } from "@/components/vm-csa/csv-upload";
import { AnalysisResults } from "@/components/vm-csa/analysis-results";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Steps, Step } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VMCSAPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Document upload state
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<string>("");
  
  // CSV template state
  const [templateColumns, setTemplateColumns] = useState<string[]>([]);
  const [templateDescription, setTemplateDescription] = useState<string>("");
  
  // Analysis results state
  const [recommendations, setRecommendations] = useState<Array<{
    type: "continue" | "review" | "terminate" | "other";
    description: string;
    riskLevel: "low" | "medium" | "high";
    reasoning: string;
  }>>([]);
  const [summary, setSummary] = useState<string>("");
  
  const handleDocumentUploadComplete = (
    docId: string,
    fileName: string,
    columns: string[],
    description: string
  ) => {
    setDocumentId(docId);
    setDocumentName(fileName);
    setTemplateColumns(columns);
    setTemplateDescription(description);
    
    // For demonstration purposes, we're setting a placeholder document content
    // In a real implementation, we would store and retrieve the actual document content
    setDocumentContent(`This is a placeholder for the content of ${fileName}. In a production environment, the actual document content would be stored and retrieved from a database or file storage.`);
    
    setActiveStep(1);
  };
  
  const handleAnalysisComplete = (
    recs: Array<{
      type: "continue" | "review" | "terminate" | "other";
      description: string;
      riskLevel: "low" | "medium" | "high";
      reasoning: string;
    }>, 
    sum: string
  ) => {
    setRecommendations(recs);
    setSummary(sum);
    setActiveStep(2);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">VM-CSA Analysis Tool</h1>
            <p className="text-muted-foreground mt-1">
              Analyze VM-CSA documents and client data for trading recommendations
            </p>
          </div>
        </div>
        
        <Steps activeStep={activeStep} className="mb-8">
          <Step title="Upload VM-CSA Document" description="Upload and analyze your VM-CSA document" />
          <Step title="Client Data" description="Download template and upload client data" />
          <Step title="Analysis Results" description="Review recommendations" />
        </Steps>
        
        <div className="space-y-8">
          {activeStep === 0 && (
            <DocumentUpload
              onUploadComplete={handleDocumentUploadComplete}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
          
          {activeStep === 1 && documentId && documentName && (
            <Tabs defaultValue="template" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="template">CSV Template</TabsTrigger>
                <TabsTrigger value="upload">Upload Client Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="template">
                <CSVTemplate
                  documentName={documentName}
                  columns={templateColumns}
                  description={templateDescription}
                />
              </TabsContent>
              
              <TabsContent value="upload">
                <CSVUpload
                  documentId={documentId}
                  documentContent={documentContent}
                  onAnalysisComplete={handleAnalysisComplete}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              </TabsContent>
            </Tabs>
          )}
          
          {activeStep === 2 && (
            <AnalysisResults
              recommendations={recommendations}
              summary={summary}
            />
          )}
          
          {activeStep > 0 && (
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={() => setActiveStep(activeStep - 1)}
                disabled={isLoading}
              >
                Back to Previous Step
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
