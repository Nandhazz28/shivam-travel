function filenameFromContentDisposition(header, fallback) {
  if (!header) return fallback;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1] || fallback;
}

export async function downloadCsv(request, fallbackFilename) {
  const res = await request();
  const filename = filenameFromContentDisposition(res.headers?.["content-disposition"], fallbackFilename);

  const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
