const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  if (req.url === '/') {
    // Serve a simple test page
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Node.js Test Server</title>
    </head>
    <body>
        <h1>Node.js Server Working!</h1>
        <p>If you can see this, Node.js servers can run on your system.</p>
        <p>The issue is specifically with Next.js development server.</p>
    </body>
    </html>
    `;
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not Found');
  }
});

const PORT = 3003;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Node.js test server running on http://localhost:${PORT}`);
});