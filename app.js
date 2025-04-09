// app.js

const http = require('http');
const express = require('express');
const url = require('url');
const path = require('path');
const EventEmitter = require('events');

const port = process.env.PORT || 3000;

const app = express();
const chatEmitter = new EventEmitter();

// Serve static files from the public folder
app.use(express.static(__dirname + '/public'));

// ========== ROUTE HANDLERS ==========

/**
 * Responds with plain text
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function respondText(req, res) {
  res.type('text');
  res.send('hi');
}

/**
 * Responds with JSON
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function respondJson(req, res) {
  res.json({
    text: 'hi',
    numbers: [1, 2, 3],
  });
}

/**
 * Responds with the input string in various formats
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function respondEcho(req, res) {
  const { input = '' } = req.query;
  res.json({
    normal: input,
    shouty: input.toUpperCase(),
    charCount: input.length,
    backwards: input.split('').reverse().join(''),
  });
}

/**
 * Serves up the chat.html file
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function chatApp(req, res) {
  res.sendFile(path.join(__dirname, '/chat.html'));
}

/**
 * Responds to chat messages sent from the client
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function respondChat(req, res) {
  const { message } = req.query;
  console.log("Received message:", message);
  chatEmitter.emit('message', message);
  res.end();
}

/**
 * Server-Sent Events stream setup
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function respondSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
  });

  const onMessage = (message) => {
    res.write(`data: ${message}\n\n`);
  };

  chatEmitter.on('message', onMessage);

  res.on('close', () => {
    chatEmitter.off('message', onMessage);
  });
}

// ========== ROUTES ==========

app.get('/', chatApp);
app.get('/json', respondJson);
app.get('/echo', respondEcho);
app.get('/chat', respondChat);
app.get('/sse', respondSSE);

// ========== SERVER LISTEN ==========

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
