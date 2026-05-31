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
  const [exportingScreenshots, setExportingScreenshots] = useState(false);

  const handleExportScreenshots = async () => {
    setExportingScreenshots(true);
    let toastId: string | number | undefined;
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Not authenticated");
      const userId = userData.user.id;

      const [tradesRes, strategiesRes] = await Promise.all([
        supabase.from("trades").select("id,symbol,entry_date,screenshot_url").eq("user_id", userId),
        supabase.from("strategies").select("id,name,screenshot_url").eq("user_id", userId),
      ]);
      if (tradesRes.error) throw tradesRes.error;
      if (strategiesRes.error) throw strategiesRes.error;

      const trades = tradesRes.data ?? [];
      const strategies = strategiesRes.data ?? [];
      const tradeIds = trades.map((t: any) => t.id);

      const tsRes = tradeIds.length
        ? await supabase.from("trade_screenshots").select("*").in("trade_id", tradeIds)
        : ({ data: [], error: null } as any);
      if (tsRes.error) throw tsRes.error;

      const tradeById = new Map(trades.map((t: any) => [t.id, t]));

      type Item = { url: string; folder: string; name: string };
      const items: Item[] = [];
      const seen = new Set<string>();
      const safe = (s: string) => (s || "untitled").replace(/[^a-z0-9._-]+/gi, "_").slice(0, 80);
      const extFromUrl = (u: string) => {
        const m = u.split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
        return m ? m[1].toLowerCase() : "jpg";
      };

      for (const t of trades as any[]) {
        if (t.screenshot_url && !seen.has(t.screenshot_url)) {
          seen.add(t.screenshot_url);
          const date = t.entry_date ? String(t.entry_date).slice(0, 10) : "no-date";
          items.push({
            url: t.screenshot_url,
            folder: `trades/${safe(t.symbol)}_${date}_${t.id.slice(0, 8)}`,
            name: `main.${extFromUrl(t.screenshot_url)}`,
          });
        }
      }
      for (const ts of (tsRes.data ?? []) as any[]) {
        if (!ts.screenshot_url || seen.has(ts.screenshot_url)) continue;
        seen.add(ts.screenshot_url);
        const t: any = tradeById.get(ts.trade_id);
        const date = t?.entry_date ? String(t.entry_date).slice(0, 10) : "no-date";
        const sym = t?.symbol ? safe(t.symbol) : "trade";
        const id = ts.trade_id.slice(0, 8);
        const tf = ts.timeframe ? safe(ts.timeframe) : "tf";
        items.push({
          url: ts.screenshot_url,
          folder: `trades/${sym}_${date}_${id}`,
          name: `${tf}_${ts.position ?? 0}_${ts.id.slice(0, 6)}.${extFromUrl(ts.screenshot_url)}`,
        });
      }
      for (const s of strategies as any[]) {
        if (s.screenshot_url && !seen.has(s.screenshot_url)) {
          seen.add(s.screenshot_url);
          items.push({
            url: s.screenshot_url,
            folder: `strategies/${safe(s.name)}_${s.id.slice(0, 8)}`,
            name: `main.${extFromUrl(s.screenshot_url)}`,
          });
        }
      }

      if (items.length === 0) {
        toast.info("No screenshots to download.");
        return;
      }

      const zip = new JSZip();
      const failed: string[] = [];
      let i = 0;
      for (const it of items) {
        i++;
        toastId = toast.loading(`Downloading screenshots... (${i}/${items.length})`, { id: toastId });
        try {
          const res = await fetch(it.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          zip.file(`${it.folder}/${it.name}`, blob);
        } catch (e) {
          failed.push(it.url);
        }
      }

      if (failed.length) {
        zip.file("_failed_urls.txt", failed.join("\n"));
      }

      toastId = toast.loading("Packaging ZIP...", { id: toastId });
      const blob = await zip.generateAsync({ type: "blob" });
      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      a.download = `trade-screenshots-${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);

      if (toastId !== undefined) toast.dismiss(toastId);
      toast.success(
        failed.length
          ? `Downloaded ${items.length - failed.length}/${items.length} screenshots. ${failed.length} failed.`
          : `Downloaded ${items.length} screenshots.`,
      );
    } catch (err) {
      console.error("Screenshot export failed:", err);
      if (toastId !== undefined) toast.dismiss(toastId);
      toast.error("Export failed — please try again.");
    } finally {
      setExportingScreenshots(false);
    }
  };


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
