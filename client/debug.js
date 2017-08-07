var CircularJSON = require('circular-json');

var serverUrl = window.SERVER_URL || window.location.origin;
var serverParsedLocation = document.createElement('a');
serverParsedLocation.href = serverUrl;

var SERVER_WS_URL = serverParsedLocation.protocol === 'https:' ?
  // Production URL
  'wss://' + serverParsedLocation.host :
  // Debug
  'ws://' + serverParsedLocation.host;

var myWebSocket = new WebSocket(SERVER_WS_URL);

var WS_KEEPALIVE_INTERVAL = 25000;

myWebSocket.onclose = function (event) {
  console.log('Socket closed with code', event.code,
    'reason', event.reason, 'wasClean', event.wasClean);
};

myWebSocket.onerror = function (event) {
  console.log('Socket error', event);
};

myWebSocket.onopen = function (event) {

  // Ready to send messages
  // console.log(myWebSocket);
  // myWebSocket.send('hello');
  // Keeping alive
  setInterval(function keepWsAlive () {
    myWebSocket.send('');
  }, WS_KEEPALIVE_INTERVAL);
};

myWebSocket.onmessage = function (event) {
  console.log('RECVD:', event.data);
};


// Implement browser-wide error interceptors
window.onerror =
  function (msg, url, line, col, error) {
    console.log(msg, url, line, col, error);
    return true; // Suppress error alerts and messages
  };

window.addEventListener('error',
  function (event) {
    console.log(event);
    return true; // Suppress error alerts and messages
  },
  true // catch on capturing phase
);




// Redirecting all console.log calls to WebSocket
var originalConsoleLog = window.console.log;

window.console.log = function consoleLog() {
  var args = arguments;
  // originalConsoleLog.call(console, 'WRAPPED');
  try {
    // TODO: use buffer instead and send
    // it after connection will be established
    function send () {
      myWebSocket.send(
        CircularJSON.stringify(
          { debug:
            { time:
                new Date().valueOf(),
              message:
                Object.keys(args)
                  .map(function (key) {
                    return args[key];
                  })
            }
          }
        )
      );
    }

    if (myWebSocket.readyState !== 1) {
      setTimeout(send, 3000);
    } else {
      send();
    }
  } catch (e) {
    // TODO: store before reconnect
    originalConsoleLog.call(console, e);
  } 
  originalConsoleLog.apply(console, arguments);
};


console.log('DEBUG MODE ENABLED');
console.log('Server URL: ' + serverUrl);
console.log('WebSocket URL: ' + SERVER_WS_URL);

console.log('Hi Steve!');



