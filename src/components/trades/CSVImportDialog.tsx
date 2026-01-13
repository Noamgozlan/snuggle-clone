import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Upload, AlertCircle, CheckCircle2, Loader2, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  symbol: string;
  trade_type: string;
  entry_price: string;
  exit_price: string;
  entry_date: string;
  exit_date: string;
  pnl: string;
  pnl_points: string;
  quantity: string;
  commission: string;
  strategy: string;
  notes: string;
}

type DetectedFormat = "tradovate" | "tradovate_orders" | "apex" | "generic" | null;

const defaultMapping: ColumnMapping = {
  symbol: "",
  trade_type: "",
  entry_price: "",
  exit_price: "",
  entry_date: "",
  exit_date: "",
  pnl: "",
  pnl_points: "",
  quantity: "",
  commission: "",
  strategy: "",
  notes: "",
};

// Clean symbol name (remove prefixes like CM.)
const cleanSymbol = (symbol: string): string => {
  if (!symbol) return "UNKNOWN";
  // Remove CM. prefix and trailing contract codes (e.g., MNQH6 -> MNQ)
  let cleaned = symbol.replace(/^CM\./, "");
  // Extract base symbol (letters only, up to 3-4 chars)
  const match = cleaned.match(/^([A-Z]{2,4})/i);
  return match ? match[1].toUpperCase() : cleaned.toUpperCase();
};

// Parse various date formats
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  // Try standard parsing first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  // Try MM/DD/YYYY HH:MM:SS format (Tradovate)
  const tradovateMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (tradovateMatch) {
    const [, month, day, year, hour, min, sec] = tradovateMatch;
    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min), parseInt(sec));
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
};

export const CSVImportDialog = ({
  open,
  onOpenChange,
  onImportComplete,
}: CSVImportDialogProps) => {
  const { user } = useAuth();
  const { activePortfolio } = usePortfolio();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(defaultMapping);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "map" | "importing" | "done">("upload");
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 });
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat>(null);
  const [parsedTrades, setParsedTrades] = useState<any[]>([]);

  const parseCSV = (text: string): { headers: string[]; rows: CSVRow[] } => {
    // Remove BOM if present
    const cleanText = text.replace(/^\uFEFF/, "");
    const lines = cleanText.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= headers.length - 1) {
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  };

  // Detect CSV format based on headers
  const detectFormat = (headers: string[]): DetectedFormat => {
    const headerSet = new Set(headers.map(h => h.toLowerCase()));
    
    // Tradovate format: ContractName, EnteredAt, ExitedAt, EntryPrice, ExitPrice, PnL, Size, Type
    if (headerSet.has("contractname") && headerSet.has("entryprice") && headerSet.has("exitprice")) {
      return "tradovate";
    }
    
    // Tradovate Orders format: orderId, B/S, Contract, Product, avgPrice, filledQty, Fill Time, Status
    if (headerSet.has("orderid") && headerSet.has("b/s") && headerSet.has("contract") && headerSet.has("status")) {
      return "tradovate_orders";
    }
    
    // Apex/Rithmic format: symbol, mov_time, mov_type, exec_qty, price_done, points, profit
    if (headerSet.has("symbol") && headerSet.has("mov_type") && headerSet.has("price_done")) {
      return "apex";
    }
    
    return "generic";
  };

  // Parse Tradovate format - each row is a complete trade
  const parseTradovateFormat = (rows: CSVRow[]): any[] => {
    return rows.map(row => {
      const entryDate = parseDate(row["EnteredAt"]);
      const exitDate = parseDate(row["ExitedAt"]);
      const tradeType = row["Type"]?.toLowerCase() === "short" ? "short" : "long";
      
      return {
        symbol: cleanSymbol(row["ContractName"]),
        trade_type: tradeType,
        entry_price: parseFloat(row["EntryPrice"]) || 0,
        exit_price: parseFloat(row["ExitPrice"]) || null,
        entry_date: entryDate?.toISOString() || null,
        exit_date: exitDate?.toISOString() || null,
        pnl: parseFloat(row["PnL"]) || null,
        quantity: Math.abs(parseInt(row["Size"])) || 1,
        commission: parseFloat(row["Fees"]) || 0,
        is_closed: true,
      };
    }).filter(t => t.symbol && t.symbol !== "UNKNOWN");
  };

  // Parse Tradovate Orders format - aggregate orders into trades
  const parseTradovateOrdersFormat = (rows: CSVRow[]): any[] => {
    // Filter only filled orders
    const filledOrders = rows.filter(row => row["Status"]?.trim().toLowerCase() === "filled");
    
    // Sort by Fill Time
    filledOrders.sort((a, b) => {
      const dateA = parseDate(a["Fill Time"]);
      const dateB = parseDate(b["Fill Time"]);
      return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
    });
    
    const trades: any[] = [];
    const openPositions: Map<string, { type: string; qty: number; price: number; date: Date | null; orderId: string }> = new Map();
    
    for (const row of filledOrders) {
      const symbol = cleanSymbol(row["Product"] || row["Contract"]);
      const buySell = row["B/S"]?.trim().toLowerCase();
      const qty = parseInt(row["filledQty"] || row["Filled Qty"]) || 0;
      const price = parseFloat(row["avgPrice"] || row["Avg Fill Price"]) || 0;
      const fillTime = parseDate(row["Fill Time"]);
      const orderId = row["orderId"] || row["Order ID"];
      
      if (qty === 0 || !buySell) continue;
      
      const isBuy = buySell === "buy";
      const positionKey = symbol;
      
      if (openPositions.has(positionKey)) {
        const openPos = openPositions.get(positionKey)!;
        const isClosing = (openPos.type === "long" && !isBuy) || (openPos.type === "short" && isBuy);
        
        if (isClosing && qty === openPos.qty) {
          // Full close
          const entryPrice = openPos.price;
          const exitPrice = price;
          const pnl = openPos.type === "long" 
            ? (exitPrice - entryPrice) * qty 
            : (entryPrice - exitPrice) * qty;
          const pnlPoints = openPos.type === "long" 
            ? exitPrice - entryPrice 
            : entryPrice - exitPrice;
          
          trades.push({
            symbol,
            trade_type: openPos.type,
            entry_price: entryPrice,
            exit_price: exitPrice,
            entry_date: openPos.date?.toISOString() || null,
            exit_date: fillTime?.toISOString() || null,
            pnl: pnl,
            pnl_points: pnlPoints,
            quantity: qty,
            commission: 0,
            is_closed: true,
            external_trade_id: openPos.orderId,
          });
          
          openPositions.delete(positionKey);
        } else if (isClosing && qty < openPos.qty) {
          // Partial close
          const entryPrice = openPos.price;
          const exitPrice = price;
          const pnl = openPos.type === "long" 
            ? (exitPrice - entryPrice) * qty 
            : (entryPrice - exitPrice) * qty;
          const pnlPoints = openPos.type === "long" 
            ? exitPrice - entryPrice 
            : entryPrice - exitPrice;
          
          trades.push({
            symbol,
            trade_type: openPos.type,
            entry_price: entryPrice,
            exit_price: exitPrice,
            entry_date: openPos.date?.toISOString() || null,
            exit_date: fillTime?.toISOString() || null,
            pnl: pnl,
            pnl_points: pnlPoints,
            quantity: qty,
            commission: 0,
            is_closed: true,
            external_trade_id: openPos.orderId,
          });
          
          openPos.qty -= qty;
        } else {
          // Adding to position
          openPos.qty += qty;
          openPos.price = (openPos.price + price) / 2; // Average price
        }
      } else {
        // New position
        openPositions.set(positionKey, {
          type: isBuy ? "long" : "short",
          qty,
          price,
          date: fillTime,
          orderId,
        });
      }
    }
    
    return trades.filter(t => t.symbol && t.symbol !== "UNKNOWN");
  };

  // Parse Apex format - aggregate orders into trades
  const parseApexFormat = (rows: CSVRow[]): any[] => {
    // Group by created_on (trade session) to find related orders
    const trades: any[] = [];
    
    // Process rows that have profit/points (these are exit orders with complete trade info)
    rows.forEach(row => {
      const profit = row["profit"];
      const points = row["points"];
      
      // Only process rows with profit data (these represent completed trades)
      if (profit && profit !== "" && !isNaN(parseFloat(profit))) {
        const execQty = parseInt(row["exec_qty"]) || 1;
        const movType = parseInt(row["mov_type"]) || 0;
        // mov_type 2 = exit, exec_qty negative = sell
        const isShort = movType === 2 && execQty < 0 ? false : movType === 1 && execQty > 0 ? false : true;
        
        const entryDate = parseDate(row["mov_time"]);
        
        trades.push({
          symbol: cleanSymbol(row["symbol"]),
          trade_type: execQty < 0 ? "short" : "long",
          entry_price: parseFloat(row["price_done"]) || 0,
          exit_price: null,
          entry_date: entryDate?.toISOString() || null,
          exit_date: null,
          pnl: parseFloat(profit) || null,
          pnl_points: parseFloat(points) || null,
          quantity: Math.abs(execQty),
          commission: 0,
          is_closed: true,
        });
      }
    });
    
    return trades.filter(t => t.symbol && t.symbol !== "UNKNOWN");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setHeaders(headers);
      setCsvData(rows);
      
      // Detect format
      const format = detectFormat(headers);
      setDetectedFormat(format);
      
      if (format === "tradovate") {
        const trades = parseTradovateFormat(rows);
        setParsedTrades(trades);
        setStep("preview");
      } else if (format === "tradovate_orders") {
        const trades = parseTradovateOrdersFormat(rows);
        setParsedTrades(trades);
        setStep("preview");
      } else if (format === "apex") {
        const trades = parseApexFormat(rows);
        setParsedTrades(trades);
        setStep("preview");
      } else {
        // Generic format - go to manual mapping
        const autoMapping = { ...defaultMapping };
        headers.forEach((header) => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes("symbol") || lowerHeader.includes("ticker") || lowerHeader.includes("סימול") || lowerHeader.includes("contractname")) {
            autoMapping.symbol = header;
          }
          if (lowerHeader.includes("type") || lowerHeader.includes("direction") || lowerHeader.includes("סוג") || lowerHeader.includes("כיוון")) {
            autoMapping.trade_type = header;
          }
          if ((lowerHeader.includes("entry") && lowerHeader.includes("price")) || lowerHeader === "entryprice") {
            autoMapping.entry_price = header;
          }
          if ((lowerHeader.includes("exit") && lowerHeader.includes("price")) || lowerHeader === "exitprice") {
            autoMapping.exit_price = header;
          }
          if ((lowerHeader.includes("entry") && lowerHeader.includes("date")) || lowerHeader === "enteredat") {
            autoMapping.entry_date = header;
          }
          if ((lowerHeader.includes("exit") && lowerHeader.includes("date")) || lowerHeader === "exitedat") {
            autoMapping.exit_date = header;
          }
          if ((lowerHeader.includes("pnl") || lowerHeader.includes("profit") || lowerHeader.includes("רווח")) && !lowerHeader.includes("point")) {
            autoMapping.pnl = header;
          }
          if (lowerHeader.includes("point") || lowerHeader.includes("נקודות")) {
            autoMapping.pnl_points = header;
          }
          if (lowerHeader.includes("quantity") || lowerHeader.includes("qty") || lowerHeader.includes("כמות") || lowerHeader.includes("size")) {
            autoMapping.quantity = header;
          }
          if (lowerHeader.includes("commission") || lowerHeader.includes("fee") || lowerHeader.includes("עמלה")) {
            autoMapping.commission = header;
          }
          if (lowerHeader.includes("strategy") || lowerHeader.includes("אסטרטגיה")) {
            autoMapping.strategy = header;
          }
          if (lowerHeader.includes("notes") || lowerHeader.includes("הערות") || lowerHeader.includes("comment")) {
            autoMapping.notes = header;
          }
        });
        setMapping(autoMapping);
        setStep("map");
      }
    };
    reader.readAsText(file);
  };

  // Import auto-detected trades
  const handleAutoImport = async () => {
    if (!user || parsedTrades.length === 0) return;

    setImporting(true);
    setStep("importing");
    let successCount = 0;
    let failCount = 0;

    for (const trade of parsedTrades) {
      try {
        const tradeData = {
          user_id: user.id,
          portfolio_id: activePortfolio?.id || null,
          ...trade,
        };

        const { error } = await supabase.from("trades").insert(tradeData);
        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error("Error importing trade:", error);
        failCount++;
      }
    }

    setImportResults({ success: successCount, failed: failCount });
    setImporting(false);
    setStep("done");
  };

  // Import with manual mapping
  const handleImport = async () => {
    if (!user) return;

    setImporting(true);
    setStep("importing");
    let successCount = 0;
    let failCount = 0;

    for (const row of csvData) {
      try {
        const tradeType = mapping.trade_type ? row[mapping.trade_type]?.toLowerCase() : "long";
        const validTradeType = tradeType === "short" || tradeType === "שורט" ? "short" : "long";

        const tradeData = {
          user_id: user.id,
          portfolio_id: activePortfolio?.id || null,
          symbol: cleanSymbol(mapping.symbol ? row[mapping.symbol] : "UNKNOWN"),
          trade_type: validTradeType,
          entry_price: mapping.entry_price ? parseFloat(row[mapping.entry_price]) || 0 : 0,
          exit_price: mapping.exit_price && row[mapping.exit_price] ? parseFloat(row[mapping.exit_price]) : null,
          entry_date: mapping.entry_date && row[mapping.entry_date] ? parseDate(row[mapping.entry_date])?.toISOString() : null,
          exit_date: mapping.exit_date && row[mapping.exit_date] ? parseDate(row[mapping.exit_date])?.toISOString() : null,
          pnl: mapping.pnl && row[mapping.pnl] ? parseFloat(row[mapping.pnl]) : null,
          pnl_points: mapping.pnl_points && row[mapping.pnl_points] ? parseFloat(row[mapping.pnl_points]) : null,
          quantity: mapping.quantity && row[mapping.quantity] ? parseFloat(row[mapping.quantity]) : 1,
          commission: mapping.commission && row[mapping.commission] ? parseFloat(row[mapping.commission]) : 0,
          strategy: mapping.strategy ? row[mapping.strategy] : null,
          notes: mapping.notes ? row[mapping.notes] : null,
          is_closed: true,
        };

        const { error } = await supabase.from("trades").insert(tradeData);
        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error("Error importing row:", error);
        failCount++;
      }
    }

    setImportResults({ success: successCount, failed: failCount });
    setImporting(false);
    setStep("done");
  };

  const handleClose = () => {
    setCsvData([]);
    setHeaders([]);
    setMapping(defaultMapping);
    setFileName(null);
    setStep("upload");
    setImportResults({ success: 0, failed: 0 });
    setDetectedFormat(null);
    setParsedTrades([]);
    onOpenChange(false);
    if (importResults.success > 0) {
      onImportComplete();
    }
  };

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  };

  const requiredFields: (keyof ColumnMapping)[] = ["symbol"];
  const isValid = requiredFields.every((field) => mapping[field]);

  const formatLabel = {
    tradovate: "Tradovate",
    tradovate_orders: "Tradovate Orders",
    apex: "Apex / Rithmic",
    generic: "כללי",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            יבוא עסקאות מ-CSV
          </DialogTitle>
          <DialogDescription>
            העלה קובץ CSV - המערכת תזהה אוטומטית את הפורמט
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium mb-1">לחץ להעלאת קובץ CSV</p>
              <p className="text-sm text-muted-foreground">או גרור ושחרר כאן</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="text-xs">Tradovate</Badge>
              <Badge variant="secondary" className="text-xs">Apex</Badge>
              <Badge variant="secondary" className="text-xs">Rithmic</Badge>
              <Badge variant="secondary" className="text-xs">CSV כללי</Badge>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <Alert className="bg-success/10 border-success/30">
              <Zap className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                <span className="font-medium">זוהה פורמט {formatLabel[detectedFormat!]}</span>
                <br />
                נמצאו {parsedTrades.length} עסקאות מוכנות לייבוא
              </AlertDescription>
            </Alert>

            <div className="bg-secondary/30 rounded-lg p-3 max-h-[200px] overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-2">תצוגה מקדימה:</p>
              <div className="space-y-1">
                {parsedTrades.slice(0, 5).map((trade, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant={trade.trade_type === "long" ? "default" : "destructive"} className="text-[10px] px-1.5">
                      {trade.trade_type.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{trade.symbol}</span>
                    <span className="text-muted-foreground">@{trade.entry_price?.toFixed(2)}</span>
                    {trade.pnl !== null && (
                      <span className={trade.pnl >= 0 ? "text-success" : "text-destructive"}>
                        {trade.pnl >= 0 ? "+" : ""}{trade.pnl?.toFixed(2)}$
                      </span>
                    )}
                  </div>
                ))}
                {parsedTrades.length > 5 && (
                  <p className="text-xs text-muted-foreground">...ועוד {parsedTrades.length - 5} עסקאות</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("map")} className="flex-1">
                מיפוי ידני
              </Button>
              <Button onClick={handleAutoImport} className="flex-1 gap-2">
                <Zap className="h-4 w-4" />
                ייבא {parsedTrades.length} עסקאות
              </Button>
            </div>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                נמצאו {csvData.length} שורות בקובץ {fileName}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">סימול *</Label>
                <Select value={mapping.symbol} onValueChange={(v) => updateMapping("symbol", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">סוג (Long/Short)</Label>
                <Select value={mapping.trade_type} onValueChange={(v) => updateMapping("trade_type", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">מחיר כניסה</Label>
                <Select value={mapping.entry_price} onValueChange={(v) => updateMapping("entry_price", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">מחיר יציאה</Label>
                <Select value={mapping.exit_price} onValueChange={(v) => updateMapping("exit_price", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">תאריך כניסה</Label>
                <Select value={mapping.entry_date} onValueChange={(v) => updateMapping("entry_date", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">תאריך יציאה</Label>
                <Select value={mapping.exit_date} onValueChange={(v) => updateMapping("exit_date", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">רווח/הפסד ($)</Label>
                <Select value={mapping.pnl} onValueChange={(v) => updateMapping("pnl", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">נקודות</Label>
                <Select value={mapping.pnl_points} onValueChange={(v) => updateMapping("pnl_points", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">כמות</Label>
                <Select value={mapping.quantity} onValueChange={(v) => updateMapping("quantity", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">עמלה</Label>
                <Select value={mapping.commission} onValueChange={(v) => updateMapping("commission", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">אסטרטגיה</Label>
                <Select value={mapping.strategy} onValueChange={(v) => updateMapping("strategy", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">הערות</Label>
                <Select value={mapping.notes} onValueChange={(v) => updateMapping("notes", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
                חזור
              </Button>
              <Button onClick={handleImport} disabled={!isValid} className="flex-1">
                ייבא {csvData.length} עסקאות
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground font-medium">מייבא עסקאות...</p>
            <p className="text-sm text-muted-foreground">אנא המתן</p>
          </div>
        )}

        {step === "done" && (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <div>
              <p className="text-foreground font-medium text-lg">הייבוא הושלם!</p>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="text-success">{importResults.success}</span> עסקאות יובאו בהצלחה
                {importResults.failed > 0 && (
                  <>, <span className="text-destructive">{importResults.failed}</span> נכשלו</>
                )}
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">סגור</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
