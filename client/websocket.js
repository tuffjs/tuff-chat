var WS_KEEPALIVE_INTERVAL = 25000;
var WS_RECONNECT_INTERVAL = 5000;

var CircularJSON = require('circular-json');

var serverUrl = window.SERVER_URL || window.location.origin;
var serverParsedLocation = document.createElement('a');
serverParsedLocation.href = serverUrl;


var SERVER_WS_URL = serverParsedLocation.protocol === 'https:' ?
  // Production URL
  'wss://' + serverParsedLocation.host :
  // Debug
  'ws://' + serverParsedLocation.host;

console.log('Server URL: ' + serverUrl);
console.log('WebSocket URL: ' + SERVER_WS_URL);

var myWebSocket = null;
var wasConnected = false;

function connect () {
  try {
    wasConected = false;
    // First time attaching to the websocket created in index.html
    var webSocket;
    if (!myWebSocket) {
      webSocket = window.g_webSocket;
      // TODO: change this to global variable
      wasConnected = true;
    } else {
      webSocket = new WebSocket(SERVER_WS_URL);
    }

    webSocket.onclose = onClose;
    webSocket.onerror = onError;
    webSocket.onopen = onOpen;
    webSocket.onmessage = onMessage;
    return webSocket;
  } catch (e) {
    return null;
  }
}

function keepConnecting () {
  var webSocket = connect();
  if (!webSocket) {
    setTimeout(keepConnecting, WS_RECONNECT_INTERVAL);
  } else {
    myWebSocket = webSocket;
  }
}

keepConnecting();

var onMessageCallback = function () {};

function onClose (event) {
  console.log('Socket closed with code', event.code,
    'reason', event.reason, 'wasClean', event.wasClean);

  if (wasConnected) {
    keepConnecting();
  }
};

function onError (event) {
  if (!wasConnected) {
    keepConnecting();
  }
  console.log('Socket error', event);
};

function onOpen (event) {

  console.log('Connected to server');

  // Ready to send messages
  wasConnected = true;

  sendBuffered();

  // Keeping alive
  var intervalId = setInterval(function keepWsAlive () {
    if (!wasConnected) {
      return;
    }

    try {
      myWebSocket.send('');
    } catch (e) {
      clearInterval(intervalId);
    }
  }, WS_KEEPALIVE_INTERVAL);
};


function onMessage (event) {

  // console.log('RECVD:', event.data);

  if (event.data) {
    var message = JSON.parse(event.data);
    onMessageCallback(message);
  }
};

var bufferedMessages = [];

function sendBuffered () {

  if (myWebSocket.readyState !== 1) {
    return;
  }

  try {
    var message;
    while (message =  bufferedMessages[0]) {
      myWebSocket.send(bufferedMessages[0]);
      bufferedMessages.shift();
    }
  } catch (e) {
    console.log('Send postponed', e);
  }
}

function sendMessage (message) {
  var data = CircularJSON.stringify(message);

  bufferedMessages.push(data);

  if (wasConnected) {
    sendBuffered();
  }
}

module.exports = {
  send: sendMessage,

  recv: function (onMessage) {
    onMessageCallback = onMessage;
  }
};

