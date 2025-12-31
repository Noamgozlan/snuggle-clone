import { useOnboarding, tourSteps } from "@/contexts/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const OnboardingTour = () => {
  const { showTour, currentStep, nextStep, prevStep, endTour, totalSteps } = useOnboarding();

  if (!showTour) return null;

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={endTour}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg mx-4 bg-card border-border shadow-2xl animate-scale-in overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-secondary">
          <div 
            className="h-full bg-gradient-to-l from-primary to-success transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={endTour}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-8 pt-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-4xl">
              {step.icon}
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex justify-center gap-1.5 mb-6">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-6 bg-primary"
                    : index < currentStep
                    ? "bg-primary/50"
                    : "bg-secondary"
                )}
              />
            ))}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground text-center mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-center leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={isFirstStep}
              className={cn(
                "gap-2",
                isFirstStep && "invisible"
              )}
            >
              <ChevronRight className="h-4 w-4" />
              הקודם
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} / {totalSteps}
            </span>

            <Button
              onClick={nextStep}
              className="gap-2 bg-gradient-to-l from-primary to-primary/80"
            >
              {isLastStep ? "סיים" : "הבא"}
              {!isLastStep && <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Skip link */}
          {!isLastStep && (
            <button
              onClick={endTour}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
            >
              דלג על המדריך
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};
