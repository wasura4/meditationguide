const fs = require("node:fs");
const path = require("node:path");
const root = path.dirname(require.resolve("pdfjs-dist/package.json"));
const output = path.resolve(__dirname, "../public/pdfjs");
fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(
  path.join(root, "build/pdf.worker.min.mjs"),
  path.join(output, "pdf.worker.min.mjs"),
);
for (const folder of ["cmaps", "standard_fonts", "wasm"])
  fs.cpSync(path.join(root, folder), path.join(output, folder), {
    recursive: true,
  });
