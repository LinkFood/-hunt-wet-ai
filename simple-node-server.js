const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple static file server
const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.url === '/') {
    // Serve our Hunt Wet AI page directly
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Hunt Wet AI</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    </head>
    <body class="antialiased">
        <div class="min-h-screen bg-gray-50">
            <header class="bg-white shadow-sm border-b">
                <div class="max-w-7xl mx-auto px-4 py-6">
                    <div class="text-center">
                        <h1 class="text-3xl font-bold text-gray-900">Hunt Wet AI</h1>
                        <p class="mt-2 text-lg text-gray-600">Your AI Hunting Companion</p>
                    </div>
                </div>
            </header>
            <main class="max-w-4xl mx-auto py-8 px-4">
                <div class="bg-white rounded-lg shadow-lg h-[600px] flex items-center justify-center">
                    <div class="text-center">
                        <h2 class="text-2xl font-bold text-green-600 mb-4">🎯 Server Working!</h2>
                        <p class="text-gray-600 mb-4">This confirms Node.js can serve web pages on your system.</p>
                        <p class="text-sm text-gray-500">The issue is specifically with Next.js development server.</p>
                        <div class="mt-8">
                            <button onclick="testConnection()" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                Test API Connection
                            </button>
                        </div>
                        <div id="result" class="mt-4"></div>
                    </div>
                </div>
            </main>
        </div>
        <script>
            function testConnection() {
                document.getElementById('result').innerHTML = '<p class="text-blue-600">Testing...</p>';
                // This confirms JavaScript is working
                setTimeout(() => {
                    document.getElementById('result').innerHTML = '<p class="text-green-600">✅ JavaScript and DOM working!</p>';
                }, 1000);
            }
        </script>
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

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Hunt Wet AI test server running on http://localhost:${PORT}`);
  console.log(`Also accessible at http://127.0.0.1:${PORT}`);
});

server.on('error', (e) => {
  console.error('Server error:', e);
});