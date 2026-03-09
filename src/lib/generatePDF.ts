import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface TradeForPDF {
  symbol: string;
  trade_type: string;
  entry_date: string | null;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  rr: number | null;
  strategy: string | null;
  mental_state: string | null;
  setup_type: string | null;
  mistakes: string[] | null;
}

interface StatsForPDF {
  totalPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  avgPnl: number;
  avgWin: number;
  avgLoss: number;
  maxWin: number;
  maxLoss: number;
}

export const generateTradingPDF = (
  trades: TradeForPDF[],
  stats: StatsForPDF,
  title: string = "דו״ח מסחר"
) => {
  const doc = new jsPDF({ orientation: "landscape" });

  // Colors
  const primaryColor: [number, number, number] = [99, 102, 241]; // indigo
  const successColor: [number, number, number] = [34, 197, 94];
  const dangerColor: [number, number, number] = [239, 68, 68];
  const darkBg: [number, number, number] = [15, 23, 42];
  const cardBg: [number, number, number] = [30, 41, 59];

  // Background
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, 297, 210, "F");

  // Header bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 297, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(title, 290, 18, { align: "right" });

  doc.setFontSize(10);
  doc.text(format(new Date(), "dd/MM/yyyy HH:mm"), 10, 18);

  // Stats cards
  const cardY = 35;
  const cardW = 55;
  const cardH = 30;
  const gap = 5;
  const startX = 297 - 10 - cardW;

  const statCards = [
    { label: "Total P&L", value: `$${stats.totalPnl.toFixed(2)}`, color: stats.totalPnl >= 0 ? successColor : dangerColor },
    { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, color: stats.winRate >= 50 ? successColor : dangerColor },
    { label: "Profit Factor", value: stats.profitFactor.toFixed(2), color: stats.profitFactor >= 1 ? successColor : dangerColor },
    { label: "Total Trades", value: `${stats.totalTrades}`, color: primaryColor },
  ];

  statCards.forEach((card, i) => {
    const x = startX - i * (cardW + gap);
    doc.setFillColor(...cardBg);
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, "F");

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(card.label, x + cardW / 2, cardY + 11, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(...card.color);
    doc.text(card.value, x + cardW / 2, cardY + 24, { align: "center" });
  });

  // Secondary stats row
  const row2Y = cardY + cardH + 5;
  const miniCards = [
    { label: "Avg Win", value: `$${stats.avgWin.toFixed(2)}` },
    { label: "Avg Loss", value: `$${stats.avgLoss.toFixed(2)}` },
    { label: "Max Win", value: `$${stats.maxWin.toFixed(2)}` },
    { label: "Max Loss", value: `$${Math.abs(stats.maxLoss).toFixed(2)}` },
    { label: "Wins", value: `${stats.winningTrades}` },
    { label: "Losses", value: `${stats.losingTrades}` },
  ];

  const miniW = (297 - 20 - 5 * gap) / 6;
  miniCards.forEach((card, i) => {
    const x = 10 + i * (miniW + gap);
    doc.setFillColor(...cardBg);
    doc.roundedRect(x, row2Y, miniW, 18, 2, 2, "F");

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(card.label, x + miniW / 2, row2Y + 7, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(226, 232, 240);
    doc.text(card.value, x + miniW / 2, row2Y + 15, { align: "center" });
  });

  // Trades table
  const tableY = row2Y + 25;

  const tableData = trades.slice(0, 30).map((t) => [
    t.symbol,
    t.trade_type.toUpperCase(),
    t.entry_date ? format(new Date(t.entry_date), "dd/MM/yy") : "—",
    t.entry_price.toFixed(2),
    t.exit_price?.toFixed(2) || "—",
    t.pnl !== null ? `$${t.pnl.toFixed(2)}` : "—",
    t.rr !== null ? t.rr.toFixed(2) : "—",
    t.strategy || "—",
  ]);

  (doc as any).autoTable({
    startY: tableY,
    head: [["Symbol", "Type", "Date", "Entry", "Exit", "P&L", "RR", "Strategy"]],
    body: tableData,
    theme: "plain",
    styles: {
      fillColor: [30, 41, 59] as [number, number, number],
      textColor: [226, 232, 240] as [number, number, number],
      fontSize: 8,
      cellPadding: 3,
      lineColor: [51, 65, 85] as [number, number, number],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [51, 65, 85] as [number, number, number],
      textColor: [148, 163, 184] as [number, number, number],
      fontSize: 8,
      fontStyle: "bold" as const,
    },
    columnStyles: {
      5: {
        cellWidth: 25,
      },
    },
    didParseCell: (data: any) => {
      // Color P&L column
      if (data.column.index === 5 && data.section === "body") {
        const val = parseFloat(data.cell.raw?.replace("$", "") || "0");
        if (val > 0) data.cell.styles.textColor = successColor;
        else if (val < 0) data.cell.styles.textColor = dangerColor;
      }
      // Color Type column
      if (data.column.index === 1 && data.section === "body") {
        if (data.cell.raw === "LONG") data.cell.styles.textColor = successColor;
        else if (data.cell.raw === "SHORT") data.cell.styles.textColor = dangerColor;
      }
    },
    margin: { left: 10, right: 10 },
  });

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Generated by Trading Journal", 148.5, pageH - 5, { align: "center" });

  // Save
  const dateStr = format(new Date(), "yyyy-MM-dd");
  doc.save(`trading-report-${dateStr}.pdf`);
};
