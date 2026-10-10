import jsPDF from "jspdf";

export function exportCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(title, rows) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  let y = 30;
  if (rows.length) {
    const headers = Object.keys(rows[0]);
    doc.text(headers.join("  |  "), 14, y);
    y += 6;
    rows.forEach((r) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(headers.map((h) => String(r[h] ?? "")).join("  |  "), 14, y);
      y += 6;
    });
  } else {
    doc.text("No data available.", 14, y);
  }
  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}