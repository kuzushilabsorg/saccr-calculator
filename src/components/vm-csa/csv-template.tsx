import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, Info } from "lucide-react";

interface CSVTemplateProps {
  documentId: string;
  documentName: string;
  columns: string[];
  description: string;
}

export function CSVTemplate({ documentName, columns, description }: Omit<CSVTemplateProps, 'documentId'>) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    setError(null);
    
    try {
      // Create the URL with query parameters
      const url = `/api/vm-csa/generate-template?columns=${encodeURIComponent(columns.join(","))}`;
      
      // Fetch the CSV content
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download template");
      }
      
      // Get the CSV content as text
      const csvContent = await response.text();
      
      // Create a Blob from the CSV content
      const blob = new Blob([csvContent], { type: "text/csv" });
      
      // Create a download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `vm-csa-template-${documentName.replace(/\.[^/.]+$/, "")}.csv`;
      
      // Trigger the download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          CSV Template
        </CardTitle>
        <CardDescription>
          Generated template based on your VM-CSA document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Document Analysis Complete</AlertTitle>
            <AlertDescription>
              We&apos;ve analyzed your VM-CSA document and generated a CSV template for you to fill with your client data.
            </AlertDescription>
          </Alert>
          
          <div className="text-sm">
            <p className="font-medium">Document: {documentName}</p>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((column, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{column}</TableCell>
                    <TableCell>Required field from VM-CSA document</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="text-sm space-y-2">
            <p className="font-medium">Template Instructions:</p>
            <p className="text-muted-foreground whitespace-pre-line">{description}</p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleDownloadTemplate}
          disabled={isDownloading}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? "Downloading..." : "Download CSV Template"}
        </Button>
      </CardFooter>
    </Card>
  );
}
