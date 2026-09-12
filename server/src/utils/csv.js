function neutralizeFormula(str) {
  if (/^[=+\-@\t\r]/.test(str)) return `'${str}`;
  return str;
}

function escapeCsvField(value) {
  if (value === null || value === undefined) return "";
  const str = neutralizeFormula(String(value));
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(columns, rows) {
  const header = columns.map((c) => escapeCsvField(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCsvField(row[c.key])).join(","));

  return [header, ...lines].join("\r\n");
}

export function sendCsv(res, filename, content) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  res.send(`\uFEFF${content}`);
}

export function dateStampedFilename(prefix) {
  const today = new Date().toISOString().slice(0, 10);
  return `${prefix}-${today}.csv`;
}
