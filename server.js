import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const host = "127.0.0.1";
const port = 8080;
const rootDir = process.cwd();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function resolvePath(urlPath) {
  const cleanPath = urlPath === "/" ? "/index.html" : urlPath;
  const normalizedPath = normalize(cleanPath).replace(/^(\.\.[\\/])+/, "");
  return join(rootDir, normalizedPath);
}

const server = createServer(async (request, response) => {
  try {
    if ((request.url || "").startsWith("/favicon.ico")) {
      response.writeHead(204);
      response.end();
      return;
    }

    const filePath = resolvePath(request.url || "/");
    const extension = extname(filePath).toLowerCase();
    const fileContent = await readFile(filePath);

    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream"
    });
    response.end(fileContent);
  } catch (error) {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    response.end("Archivo no encontrado.");
  }
});

server.listen(port, host, () => {
  console.log(`Servidor listo en http://${host}:${port}`);
});
