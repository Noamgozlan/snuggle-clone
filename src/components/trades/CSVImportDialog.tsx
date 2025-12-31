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
import { useToast } from "@/hooks/use-toast";
import { FileUp, Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export const CSVImportDialog = ({
  open,
  onOpenChange,
  onImportComplete,
}: CSVImportDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(defaultMapping);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "map" | "importing" | "done">("upload");
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 });

  const parseCSV = (text: string): { headers: string[]; rows: CSVRow[] } => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    // Parse headers
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);

    // Parse data rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
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
      
      // Auto-detect column mapping
      const autoMapping = { ...defaultMapping };
      headers.forEach((header) => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes("symbol") || lowerHeader.includes("ticker") || lowerHeader.includes("סימול")) {
          autoMapping.symbol = header;
        }
        if (lowerHeader.includes("type") || lowerHeader.includes("direction") || lowerHeader.includes("סוג") || lowerHeader.includes("כיוון")) {
          autoMapping.trade_type = header;
        }
        if (lowerHeader.includes("entry") && lowerHeader.includes("price") || lowerHeader.includes("כניסה")) {
          autoMapping.entry_price = header;
        }
        if (lowerHeader.includes("exit") && lowerHeader.includes("price") || lowerHeader.includes("יציאה")) {
          autoMapping.exit_price = header;
        }
        if (lowerHeader.includes("entry") && lowerHeader.includes("date") || lowerHeader.includes("תאריך כניסה")) {
          autoMapping.entry_date = header;
        }
        if (lowerHeader.includes("exit") && lowerHeader.includes("date") || lowerHeader.includes("תאריך יציאה")) {
          autoMapping.exit_date = header;
        }
        if ((lowerHeader.includes("pnl") || lowerHeader.includes("profit") || lowerHeader.includes("רווח")) && !lowerHeader.includes("point")) {
          autoMapping.pnl = header;
        }
        if (lowerHeader.includes("point") || lowerHeader.includes("נקודות")) {
          autoMapping.pnl_points = header;
        }
        if (lowerHeader.includes("quantity") || lowerHeader.includes("qty") || lowerHeader.includes("כמות") || lowerHeader.includes("contracts")) {
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
    };
    reader.readAsText(file);
  };

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
          symbol: (mapping.symbol ? row[mapping.symbol] : "UNKNOWN").toUpperCase(),
          trade_type: validTradeType,
          entry_price: mapping.entry_price ? parseFloat(row[mapping.entry_price]) || 0 : 0,
          exit_price: mapping.exit_price && row[mapping.exit_price] ? parseFloat(row[mapping.exit_price]) : null,
          entry_date: mapping.entry_date && row[mapping.entry_date] ? new Date(row[mapping.entry_date]).toISOString() : null,
          exit_date: mapping.exit_date && row[mapping.exit_date] ? new Date(row[mapping.exit_date]).toISOString() : null,
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
    onOpenChange(false);
    if (importResults.success > 0) {
      onImportComplete();
    }
  };

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  };

  const requiredFields: (keyof ColumnMapping)[] = ["symbol", "entry_price"];
  const isValid = requiredFields.every((field) => mapping[field]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            יבוא עסקאות מ-CSV
          </DialogTitle>
          <DialogDescription>
            העלה קובץ CSV עם העסקאות שלך ומפה את העמודות
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
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
                <Label className="text-sm">מחיר כניסה *</Label>
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
