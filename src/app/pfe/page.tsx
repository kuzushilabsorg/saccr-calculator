import { Metadata } from "next";
import PFEForm from "@/components/pfe/pfe-form";

export const metadata: Metadata = {
  title: "Potential Future Exposure (PFE) Calculator",
  description: "Calculate Potential Future Exposure (PFE) based on the SA-CCR framework",
};

export default function PFEPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Potential Future Exposure (PFE) Calculator</h1>
        <p className="text-muted-foreground mt-2">
          Calculate Potential Future Exposure (PFE) for your portfolio using the SA-CCR framework
        </p>
      </div>
      <PFEForm />
    </div>
  );
}
