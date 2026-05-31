import { useState } from "react";
import JSZip from "jszip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ScreenshotEntry = string | { url: string; failed: true };

async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export const DataExportCard = () => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Not authenticated");
      const userId = userData.user.id;
      const userEmail = userData.user.email ?? "";

      const [
        profilesRes,
        portfoliosRes,
        strategiesRes,
        tradesRes,
        dailyNotesRes,
        tradingGoalsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId),
        supabase.from("portfolios").select("*").eq("user_id", userId),
        supabase.from("strategies").select("*").eq("user_id", userId),
        supabase.from("trades").select("*").eq("user_id", userId),
        supabase.from("daily_notes").select("*").eq("user_id", userId),
        supabase.from("trading_goals").select("*").eq("user_id", userId),
      ]);

      for (const r of [profilesRes, portfoliosRes, strategiesRes, tradesRes, dailyNotesRes, tradingGoalsRes]) {
        if (r.error) throw r.error;
      }

      const strategies = strategiesRes.data ?? [];
      const trades = tradesRes.data ?? [];
      const strategyIds = strategies.map((s: any) => s.id);
      const tradeIds = trades.map((t: any) => t.id);

      const [confirmationsRes, tradeScreenshotsRes, tradeConfirmationsRes] = await Promise.all([
        strategyIds.length
          ? supabase.from("confirmations").select("*").in("strategy_id", strategyIds)
          : Promise.resolve({ data: [], error: null } as any),
        tradeIds.length
          ? supabase.from("trade_screenshots").select("*").in("trade_id", tradeIds)
          : Promise.resolve({ data: [], error: null } as any),
        tradeIds.length
          ? supabase.from("trade_confirmations").select("*").in("trade_id", tradeIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      for (const r of [confirmationsRes, tradeScreenshotsRes, tradeConfirmationsRes]) {
        if (r.error) throw r.error;
      }

      const tradeScreenshots = tradeScreenshotsRes.data ?? [];
      const confirmations = confirmationsRes.data ?? [];
      const tradeConfirmations = tradeConfirmationsRes.data ?? [];

      const urlSet = new Set<string>();
      for (const ts of tradeScreenshots) if (ts.screenshot_url) urlSet.add(ts.screenshot_url);
      for (const t of trades) if ((t as any).screenshot_url) urlSet.add((t as any).screenshot_url);
      for (const s of strategies) if ((s as any).screenshot_url) urlSet.add((s as any).screenshot_url);

      const urls = Array.from(urlSet);
      const screenshots: Record<string, ScreenshotEntry> = {};
      let toastId: string | number | undefined;
      let i = 0;
      for (const url of urls) {
        i++;
        toastId = toast.loading(`Fetching screenshots... (${i}/${urls.length})`, { id: toastId });
        try {
          screenshots[url] = await urlToBase64(url);
        } catch {
          screenshots[url] = { url, failed: true };
        }
      }
      if (toastId !== undefined) toast.dismiss(toastId);

      const exportObj = {
        version: "snuggle-export-v1",
        exported_at: new Date().toISOString(),
        user_email: userEmail,
        data: {
          profiles: profilesRes.data ?? [],
          portfolios: portfoliosRes.data ?? [],
          strategies,
          confirmations,
          trades,
          trade_screenshots: tradeScreenshots,
          trade_confirmations: tradeConfirmations,
          daily_notes: dailyNotesRes.data ?? [],
          trading_goals: tradingGoalsRes.data ?? [],
        },
        screenshots,
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      a.download = `snuggle-export-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);

      toast.success("Export complete! Upload this file in your new account to restore all your data.");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Export failed — please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Move My Data</h2>
          <p className="text-muted-foreground text-sm">
            Export all your trades, screenshots, strategies, and notes into a portable file you can import into any new account.
          </p>
        </div>
      </div>
      <Button onClick={handleExport} disabled={exporting} className="mt-4">
        {exporting ? (
          <>
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 me-2" />
            Export My Data
          </>
        )}
      </Button>
    </Card>
  );
};
