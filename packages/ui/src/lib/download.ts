export function formatTimestampForFilename(date: Date = new Date()): string {
  return date.toISOString().replace(/[:]/g, "-");
}

export function downloadTextFile(filename: string, content: string, mime: string = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  downloadBlob(filename, blob);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


