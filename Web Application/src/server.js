const https = require('https');
const http = require('http');
const fs = require('fs');
const app = require('./app');
const WebSocketHandler = require('./websocket/websocketHandler');

// Read SSL certificate files
const options = {
  key: fs.readFileSync('./ssl/private.key.pem'),
  cert: fs.readFileSync('./ssl/domain.cert.pem'),
  ca: fs.readFileSync('./ssl/intermediate.cert.pem')
};

// Create an HTTPS server
const httpsServer = https.createServer(options, app);

// Initialize WebSocketHandler with the HTTPS server
WebSocketHandler.init(httpsServer);

const HTTPS_PORT = 443; // Standard HTTPS port
const HTTP_PORT = 80;  // Standard HTTP port
const HOST = '0.0.0.0';

// Create an HTTP server that redirects to HTTPS
const httpServer = http.createServer((req, res) => {
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
});

// Start the HTTPS server
httpsServer.listen(HTTPS_PORT, HOST, async () => {
  try {
    console.log(`HTTPS Server is running on https://${HOST}:${HTTPS_PORT}`);
  } catch (error) {
    console.error('Unable to start HTTPS server:', error);
  }
});

// Start the HTTP server (for redirection)
httpServer.listen(HTTP_PORT, HOST, () => {
  console.log(`HTTP Server is running on http://${HOST}:${HTTP_PORT} (redirecting to HTTPS)`);
});
