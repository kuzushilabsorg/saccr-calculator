import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

interface Recommendation {
  type: "continue" | "review" | "terminate" | "other";
  description: string;
  riskLevel: "low" | "medium" | "high";
  reasoning: string;
}

interface AnalysisResultsProps {
  recommendations: Recommendation[];
  summary: string;
}

export function AnalysisResults({ recommendations, summary }: AnalysisResultsProps) {
  // Helper function to get the appropriate icon and color for a recommendation type
  const getRecommendationDetails = (type: string) => {
    switch (type) {
      case "continue":
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          color: "bg-green-100 text-green-800",
          label: "Continue Trading",
        };
      case "review":
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          color: "bg-yellow-100 text-yellow-800",
          label: "Review Required",
        };
      case "terminate":
        return {
          icon: <XCircle className="h-5 w-5" />,
          color: "bg-red-100 text-red-800",
          label: "Terminate Trading",
        };
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          color: "bg-blue-100 text-blue-800",
          label: "Other Action",
        };
    }
  };

  // Helper function to get the appropriate badge color for risk level
  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Analysis Results
        </CardTitle>
        <CardDescription>
          Recommendations based on VM-CSA document and client data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Analysis Complete</AlertTitle>
            <AlertDescription>
              We&apos;ve analyzed the client data against the VM-CSA requirements and generated recommendations.
              Each recommendation is categorized by type and risk level.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Summary</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{summary}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Recommendations</h3>
            
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recommendations available.</p>
            ) : (
              <div className="space-y-4">
                {recommendations.map((recommendation, index) => {
                  const { icon, color, label } = getRecommendationDetails(recommendation.type);
                  const riskBadgeColor = getRiskBadgeColor(recommendation.riskLevel);
                  
                  return (
                    <div key={index} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${color}`}>
                            {icon}
                          </div>
                          <span className="font-medium">{label}: {recommendation.description}</span>
                        </div>
                        <Badge className={riskBadgeColor}>
                          {recommendation.riskLevel.charAt(0).toUpperCase() + recommendation.riskLevel.slice(1)} Risk
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Reasoning:</p>
                        <p className="whitespace-pre-line">{recommendation.reasoning}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground mt-4">
            <p className="italic">
              Note: These recommendations are generated based on the analysis of the VM-CSA document and the provided client data. 
              They should be reviewed by a qualified professional before making any final decisions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
