import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const EconomicNews = () => {
  const { t } = useLanguage();

  const htmlContent = encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
      </style>
    </head>
    <body>
      <div class="myfxbookWidget" data-widget-type="economic-calendar" data-theme="dark" data-height="700"></div>
      <script type="text/javascript" src="https://widgets.myfxbook.com/scripts/economic-calendar.js"><\/script>
    </body>
    </html>
  `);

  return (
    <DashboardLayout title={t("news.title")}>
      <div className="w-full max-w-6xl mx-auto px-0 md:px-4">
        <iframe
          srcDoc={decodeURIComponent(htmlContent)}
          className="w-full rounded-xl border border-border"
          style={{ height: "700px", minHeight: "600px" }}
          sandbox="allow-scripts allow-same-origin allow-popups"
          title="Economic Calendar"
        />
      </div>
    </DashboardLayout>
  );
};

export default EconomicNews;
