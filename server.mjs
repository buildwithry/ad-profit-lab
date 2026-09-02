import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const files = new Set(["index.html", "styles.css", "app.js"]);
const types = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript" };

createServer(async (request, response) => {
  const file = request.url === "/" ? "index.html" : request.url.slice(1);
  if (!files.has(file)) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    const body = await readFile(join(import.meta.dirname, file));
    response.setHeader("Content-Type", types[extname(file)] || "text/plain");
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(4173, "127.0.0.1", () => console.log("Ad Profit Lab: http://127.0.0.1:4173"));
