import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const EconomicNews = () => {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("news.title")}>
      <div className="w-full max-w-6xl mx-auto px-0 md:px-4">
        <iframe
          src="https://www.myfxbook.com/forex-economic-calendar?lang=en&impacts=2,3"
          className="w-full rounded-xl border border-border bg-card"
          style={{ height: "700px", minHeight: "600px" }}
          title="Economic Calendar"
          allowFullScreen
        />
      </div>
    </DashboardLayout>
  );
};

export default EconomicNews;
