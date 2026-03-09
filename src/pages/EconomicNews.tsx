import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ExternalLink, AlertTriangle } from "lucide-react";

const EconomicNews = () => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [widgetFailed, setWidgetFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = "";

    // Create widget div
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "myfxbookWidget";
    widgetDiv.setAttribute("data-widget-type", "economic-calendar");
    widgetDiv.setAttribute("data-theme", "dark");
    widgetDiv.setAttribute("data-height", "700");
    containerRef.current.appendChild(widgetDiv);

    // Load script
    const script = document.createElement("script");
    script.src = "https://widgets.myfxbook.com/scripts/economic-calendar.js";
    script.type = "text/javascript";
    script.async = true;

    script.onload = () => {
      // Check after a delay if widget actually rendered content
      setTimeout(() => {
        const hasContent = containerRef.current && containerRef.current.querySelector("table, .calendar, iframe, [class*='calendar']");
        if (hasContent) {
          setWidgetLoaded(true);
        } else {
          setWidgetFailed(true);
        }
      }, 3000);
    };

    script.onerror = () => {
      setWidgetFailed(true);
    };

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (!widgetLoaded) {
        setWidgetFailed(true);
      }
    }, 6000);

    containerRef.current.appendChild(script);

    return () => {
      clearTimeout(timeout);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <DashboardLayout title={t("news.title")}>
      <div className="w-full max-w-6xl mx-auto px-0 md:px-4 space-y-4">
        {/* Script-based widget container — hidden if failed */}
        <div
          ref={containerRef}
          className={widgetFailed ? "hidden" : "w-full min-h-[600px] rounded-xl overflow-hidden border border-border bg-card"}
        />

        {/* Fallback UI */}
        {widgetFailed && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-8 w-8 text-primary" />
              </div>

              <div className="space-y-2 max-w-md">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("news.title")}
                </h2>
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>External widget cannot be embedded in this environment.</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Open the full economic calendar in a new tab to view upcoming events, impact levels, and forecasts.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild>
                  <a
                    href="https://www.myfxbook.com/forex-economic-calendar"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Myfxbook Calendar
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href="https://www.forexfactory.com/calendar"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Forex Factory
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EconomicNews;
