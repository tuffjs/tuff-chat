// Implement browser-wide error interceptors

const serverUrl = window.SERVER_URL || window.location.origin;
const serverParsedLocation = document.createElement('a');
serverParsedLocation.href = serverUrl;

const SERVER_WS_URL = serverParsedLocation.protocol === 'https:' ?
  // Production URL
  'wss://' + serverParsedLocation.host :
  // Debug
  'ws://' + serverParsedLocation.host;

const myWebSocket = new WebSocket(SERVER_WS_URL);

const WS_KEEPALIVE_INTERVAL = 25000;

myWebSocket.onopen = (event) => {
  // console.log(myWebSocket);
  // myWebSocket.send('hello');
  // Keeping alive
  setInterval(function keepWsAlive () {
    myWebSocket.send('');
  }, WS_KEEPALIVE_INTERVAL);
};



// Redirecting all console.log calls to WebSocket
var originalConsoleLog = window.console.log;

window.console.log = function consoleLog() {
  var args = arguments;
  // originalConsoleLog.call(console, 'WRAPPED');
  try {
    // TODO: use buffer instead and send
    // it after connection will be established
    setTimeout(function send () {
    myWebSocket.send(
      JSON.stringify(
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
    }, 3000);
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



