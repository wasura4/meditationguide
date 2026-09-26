// Only called in the browser. The worker and fonts are served from this app.
export async function pdfClient() {
  const pdf = await import("pdfjs-dist");
  pdf.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  return pdf;
}
export const pdfOptions = {
  cMapUrl: "/pdfjs/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "/pdfjs/standard_fonts/",
  wasmUrl: "/pdfjs/wasm/",
  isEvalSupported: false,
};
