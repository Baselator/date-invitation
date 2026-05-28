const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 8888);
const publicDir = path.join(__dirname, "public");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === "POST") {
    req.resume();

    if ((req.url || "").split("?")[0] === "/api/send-response") {
      send(res, 200, JSON.stringify({ ok: true, local: true }), "application/json; charset=utf-8");
      return;
    }

    send(res, 200, "OK");
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method not allowed");
    return;
  }

  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const requestedPath = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.resolve(publicDir, `.${requestedPath}`);

  if (!filePath.startsWith(publicDir)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      fs.readFile(path.join(publicDir, "index.html"), (fallbackError, fallback) => {
        if (fallbackError) {
          send(res, 404, "Not found");
          return;
        }

        res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
        res.end(req.method === "HEAD" ? undefined : fallback);
      });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream"
    });
    res.end(req.method === "HEAD" ? undefined : data);
  });
});

server.listen(port, () => {
  console.log(`Date invitation running at http://localhost:${port}`);
});
