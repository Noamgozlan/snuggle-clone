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

      type Kind = "trade_main" | "trade_extra" | "strategy_main";
      type Item = {
        url: string;
        path: string;
        kind: Kind;
        trade_id?: string;
        trade_screenshot_id?: string;
        strategy_id?: string;
        symbol?: string;
        entry_date?: string | null;
        timeframe?: string | null;
        position?: number | null;
      };
      const items: Item[] = [];
      const seen = new Map<string, Item>();
      const safe = (s: string) => (s || "untitled").replace(/[^a-z0-9._-]+/gi, "_").slice(0, 80);
      const extFromUrl = (u: string) => {
        const m = u.split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
        return m ? m[1].toLowerCase() : "jpg";
      };

      const addItem = (it: Item) => {
        const existing = seen.get(it.url);
        if (existing) return existing;
        items.push(it);
        seen.set(it.url, it);
        return it;
      };

      for (const t of trades as any[]) {
        if (!t.screenshot_url) continue;
        const date = t.entry_date ? String(t.entry_date).slice(0, 10) : "no-date";
        // Full trade_id in folder name so importers can match unambiguously
        const folder = `trades/${safe(t.symbol)}_${date}__${t.id}`;
        addItem({
          url: t.screenshot_url,
          path: `${folder}/main.${extFromUrl(t.screenshot_url)}`,
          kind: "trade_main",
          trade_id: t.id,
          symbol: t.symbol,
          entry_date: t.entry_date,
        });
      }
      for (const ts of (tsRes.data ?? []) as any[]) {
        if (!ts.screenshot_url) continue;
        const t: any = tradeById.get(ts.trade_id);
        const date = t?.entry_date ? String(t.entry_date).slice(0, 10) : "no-date";
        const sym = t?.symbol ? safe(t.symbol) : "trade";
        const folder = `trades/${sym}_${date}__${ts.trade_id}`;
        const tf = ts.timeframe ? safe(ts.timeframe) : "tf";
        addItem({
          url: ts.screenshot_url,
          path: `${folder}/extra_${tf}_pos${ts.position ?? 0}__${ts.id}.${extFromUrl(ts.screenshot_url)}`,
          kind: "trade_extra",
          trade_id: ts.trade_id,
          trade_screenshot_id: ts.id,
          symbol: t?.symbol,
          entry_date: t?.entry_date ?? null,
          timeframe: ts.timeframe ?? null,
          position: ts.position ?? null,
        });
      }
      for (const s of strategies as any[]) {
        if (!s.screenshot_url) continue;
        addItem({
          url: s.screenshot_url,
          path: `strategies/${safe(s.name)}__${s.id}/main.${extFromUrl(s.screenshot_url)}`,
          kind: "strategy_main",
          strategy_id: s.id,
        });
      }

      if (items.length === 0) {
        toast.info("No screenshots to download.");
        return;
      }

      const zip = new JSZip();
      const failed: string[] = [];
      let i = 0;
      const manifestFiles: Array<Omit<Item, "url"> & { url: string; downloaded: boolean }> = [];
      for (const it of items) {
        i++;
        toastId = toast.loading(`Downloading screenshots... (${i}/${items.length})`, { id: toastId });
        let downloaded = false;
        try {
          const res = await fetch(it.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          zip.file(it.path, blob);
          downloaded = true;
        } catch (e) {
          failed.push(it.url);
        }
        manifestFiles.push({ ...it, downloaded });
      }

      // Manifest: lets any importer map each file back to its trade/strategy
      const manifest = {
        version: "snuggle-screenshots-v1",
        exported_at: new Date().toISOString(),
        user_id: userId,
        path_convention: {
          trade_main: "trades/<symbol>_<entry_date>__<trade_id>/main.<ext>",
          trade_extra: "trades/<symbol>_<entry_date>__<trade_id>/extra_<timeframe>_pos<position>__<trade_screenshot_id>.<ext>",
          strategy_main: "strategies/<name>__<strategy_id>/main.<ext>",
        },
        files: manifestFiles,
      };
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      zip.file(
        "README.txt",
        [
          "Trade Screenshots Export",
          "",
          "Each file is placed in a folder named after its trade or strategy.",
          "The folder ends with the full trade_id or strategy_id (after the '__' separator).",
          "",
          "manifest.json contains the authoritative mapping: each file path is linked",
          "to its trade_id (or strategy_id), original URL, timeframe and position.",
          "When importing into a new account, use manifest.json to re-attach every",
          "screenshot to the correct trade — do not rely on folder names alone.",
        ].join("\n"),
      );

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
      <div className="flex flex-wrap gap-2 mt-4">
        <Button onClick={handleExport} disabled={exporting || exportingScreenshots}>
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
        <Button
          onClick={handleExportScreenshots}
          disabled={exporting || exportingScreenshots}
          variant="outline"
        >
          {exportingScreenshots ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 me-2" />
              Download All Screenshots (ZIP)
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
