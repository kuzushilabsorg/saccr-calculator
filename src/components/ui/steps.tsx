import React from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface StepsProps {
  activeStep: number;
  children: React.ReactNode;
  className?: string;
}

export function Steps({ activeStep, children, className }: StepsProps) {
  // Convert children to array
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={cn("flex w-full", className)}>
      {childrenArray.map((child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<StepProps>, {
            stepNumber: index + 1,
            isActive: activeStep === index,
            isCompleted: activeStep > index,
            isLastStep: index === childrenArray.length - 1,
            key: index,
          });
        }
        return child;
      })}
    </div>
  );
}

interface StepProps {
  title: string;
  description?: string;
  stepNumber?: number;
  isActive?: boolean;
  isCompleted?: boolean;
  isLastStep?: boolean;
}

export function Step({
  title,
  description,
  stepNumber,
  isActive,
  isCompleted,
  isLastStep,
}: StepProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 font-semibold",
            {
              "border-primary bg-primary text-primary-foreground": isActive || isCompleted,
              "border-border bg-background text-muted-foreground": !isActive && !isCompleted,
            }
          )}
        >
          {isCompleted ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <span>{stepNumber}</span>
          )}
        </div>
        
        {!isLastStep && (
          <div
            className={cn("h-[2px] flex-1", {
              "bg-primary": isCompleted,
              "bg-border": !isCompleted,
            })}
          />
        )}
      </div>
      
      <div className="mt-2">
        <h3
          className={cn("text-sm font-medium", {
            "text-foreground": isActive || isCompleted,
            "text-muted-foreground": !isActive && !isCompleted,
          })}
        >
          {title}
        </h3>
        
        {description && (
          <p
            className={cn("text-xs", {
              "text-muted-foreground": isActive || isCompleted,
              "text-muted-foreground/60": !isActive && !isCompleted,
            })}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
