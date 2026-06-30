export function downloadTextFile({ content, fileName, type }) {
  const blob = new Blob([content], { type });
  downloadBlobFile({ blob, fileName });
}

export function downloadBlobFile({ blob, fileName }) {
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement("a");

  link.href = url;
  link.download = fileName;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
