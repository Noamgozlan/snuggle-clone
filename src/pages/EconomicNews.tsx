import { useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const EconomicNews = () => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "myfxbookWidget";
    widgetDiv.setAttribute("data-widget-type", "economic-calendar");
    widgetDiv.setAttribute("data-theme", "dark");
    widgetDiv.setAttribute("data-height", "700");
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://widgets.myfxbook.com/scripts/economic-calendar.js";
    script.type = "text/javascript";
    script.async = true;
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <DashboardLayout title={t("news.title")}>
      <div className="w-full max-w-6xl mx-auto px-0 md:px-4">
        <div
          ref={containerRef}
          className="w-full min-h-[600px] max-h-[800px] rounded-xl overflow-hidden border border-border bg-card"
        />
      </div>
    </DashboardLayout>
  );
};

export default EconomicNews;
