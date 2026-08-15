import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const COMPANY_NAME = "Addis HRMS";

function drawCompanyHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(14, 12, 14, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("HR", 18.5, 21);

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY_NAME, 32, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(title, 32, 23);

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 28, doc.internal.pageSize.getWidth() - 14, 28);
}

export function exportGenericPdf(title: string, headers: string[], rows: (string | number)[][]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  drawCompanyHeader(doc, title);

  autoTable(doc, {
    startY: 34,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, "_")}_report.pdf`);
}

export function exportGenericExcel(title: string, headers: string[], rows: (string | number)[][]) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 30));
  XLSX.writeFile(workbook, `${title.toLowerCase().replace(/\s+/g, "_")}_report.xlsx`);
}

export function printGenericReport(title: string, headers: string[], rows: (string | number)[][]) {
  const win = window.open("", "_blank");
  if (!win) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${COMPANY_NAME}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #111827; }
          h1 { margin: 0 0 4px 0; font-size: 20px; }
          p { margin: 0 0 16px 0; color: #6b7280; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: 600; }
          tr:nth-child(even) { background-color: #f9fafb; }
        </style>
      </head>
      <body>
        <h1>${COMPANY_NAME} — ${title}</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;
  win.document.write(html);
  win.document.close();
}
