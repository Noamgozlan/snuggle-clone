import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface OnboardingContextType {
  showTour: boolean;
  currentStep: number;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  totalSteps: number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const TOUR_COMPLETED_KEY = "gozlan_journal_tour_completed";

export const tourSteps = [
  {
    id: "welcome",
    title: "ברוכים הבאים ל-GozlanJournal! 🎉",
    description: "המערכת שתעזור לך לעקוב, לנתח ולשפר את ביצועי המסחר שלך. בואו נלמד את הכלים העיקריים.",
    icon: "🏠",
  },
  {
    id: "dashboard",
    title: "דף הבית - סקירה כללית",
    description: "כאן תראה את כל הנתונים החשובים: רווח/הפסד כולל, אחוז הצלחה, מקדם רווח וממוצע לעסקה. ניתן לעבור בין תצוגת כסף לנקודות.",
    icon: "📊",
  },
  {
    id: "trades",
    title: "עסקאות",
    description: "הוסף, ערוך ונהל את כל העסקאות שלך. ניתן להוסיף עסקה ידנית או לייבא קובץ CSV מהברוקר שלך.",
    icon: "📈",
  },
  {
    id: "statistics",
    title: "סטטיסטיקות",
    description: "נתונים מעמיקים על הביצועים שלך: גרפים, ניתוח לפי יום/שעה, אסטרטגיות מצליחות ועוד.",
    icon: "📉",
  },
  {
    id: "calendar",
    title: "לוח שנה",
    description: "ראה את הביצועים שלך מסודרים לפי ימים. צבעים ירוקים מסמנים ימים רווחיים ואדומים ימי הפסד.",
    icon: "📅",
  },
  {
    id: "community",
    title: "קהילה",
    description: "שתף עסקאות עם סוחרים אחרים, למד מהניסיון שלהם וקבל פידבק על העסקאות שלך.",
    icon: "👥",
  },
  {
    id: "addTrade",
    title: "הוספת עסקה",
    description: "לחץ על כפתור 'הוסף עסקה' כדי לתעד עסקה חדשה. מלא את הפרטים: סימבול, כיוון, מחיר כניסה ויציאה.",
    icon: "➕",
  },
  {
    id: "displayMode",
    title: "מצב תצוגה",
    description: "עבור בין תצוגת כסף ($) לתצוגת נקודות. שימושי אם אתה סוחר בחוזים עתידיים.",
    icon: "💵",
  },
  {
    id: "theme",
    title: "מצב תאורה",
    description: "לחץ על אייקון השמש/ירח בפינה השמאלית העליונה כדי להחליף בין מצב כהה לבהיר.",
    icon: "🌙",
  },
  {
    id: "done",
    title: "מוכן להתחיל! 🚀",
    description: "זהו! עכשיו אתה מוכן להתחיל לתעד את העסקאות שלך ולשפר את הביצועים. בהצלחה במסחר!",
    icon: "✅",
  },
];

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!tourCompleted) {
      // Delay showing the tour to let the page load
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = () => {
    setCurrentStep(0);
    setShowTour(true);
  };

  const endTour = () => {
    setShowTour(false);
    setCurrentStep(0);
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < tourSteps.length) {
      setCurrentStep(step);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        showTour,
        currentStep,
        startTour,
        endTour,
        nextStep,
        prevStep,
        goToStep,
        totalSteps: tourSteps.length,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
