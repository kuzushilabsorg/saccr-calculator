import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileType, AlertCircle, File, FileText, Image, FileCode, CheckCircle2 } from "lucide-react";
import { DocumentType } from "@/lib/vm-csa/types";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onUploadComplete: (documentId: string, fileName: string, templateColumns: string[], templateDescription: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function DocumentUpload({ onUploadComplete, isLoading, setIsLoading }: DocumentUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes: DocumentType[] = ["pdf", "doc", "png", "jpg", "md"];
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/vm-csa/analyze-document", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload document");
      }
      
      const data = await response.json();
      
      onUploadComplete(
        data.document.id,
        data.document.fileName,
        data.csvTemplate.columns,
        data.csvTemplate.description
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

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <File className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <Image className="h-5 w-5 text-green-500" />;
      case 'md':
        return <FileCode className="h-5 w-5 text-purple-500" />;
      default:
        return <FileType className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };
  
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload VM-CSA Document
        </CardTitle>
        <CardDescription>
          Upload your VM-CSA document to analyze and generate a CSV template
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div 
            className={cn(
              "border-2 border-dashed rounded-lg transition-all duration-200",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20",
              file ? "bg-muted/20" : "bg-background"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.md"
              onChange={handleFileChange}
              className="hidden"
            />
            <div 
              onClick={triggerFileInput}
              className="flex flex-col items-center justify-center py-8 px-4 cursor-pointer"
            >
              {!file ? (
                <>
                  <div className="mb-4 p-4 rounded-full bg-primary/10">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">Drag & drop your file here</h3>
                  <p className="text-sm text-muted-foreground mb-3">or click to browse files</p>
                  <div className="flex flex-wrap justify-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-primary/10 rounded-md text-xs flex items-center gap-1">
                      <File className="h-3 w-3 text-red-500" /> PDF
                    </span>
                    <span className="px-2 py-1 bg-primary/10 rounded-md text-xs flex items-center gap-1">
                      <FileText className="h-3 w-3 text-blue-500" /> DOC
                    </span>
                    <span className="px-2 py-1 bg-primary/10 rounded-md text-xs flex items-center gap-1">
                      <Image className="h-3 w-3 text-green-500" /> PNG/JPG
                    </span>
                    <span className="px-2 py-1 bg-primary/10 rounded-md text-xs flex items-center gap-1">
                      <FileCode className="h-3 w-3 text-purple-500" /> MD
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <div className="mb-3 p-3 rounded-full bg-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {getFileIcon(file.name)}
                    <span className="font-medium truncate max-w-[250px]">{file.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB • Click to change file
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <FileType className="h-4 w-4" />
              <span>Supported formats: PDF, DOC, PNG, JPG, MD</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Max size: 10MB
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="w-full h-11"
        >
          {isLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
              Analyzing Document...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Analyze Document
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
