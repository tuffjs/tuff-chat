var wsSend = function () {};

var reloadConfirmationDialogIsDisplayed = false;

function initDebug (wsSendFunction) {

  wsSend = wsSendFunction;

  return {
    receive: function onMessage (message) {

      if (message.debug) {
        if (message.debug.reload) {
          if (message.debug.hash !== window.JAVASCRIPT_BUNDLE_HASH) {

            if (!reloadConfirmationDialogIsDisplayed) {
              reloadConfirmationDialogIsDisplayed = true;

              if (window.confirm(
                  'Browser-side assets bundled successfully. Reload?')) {
                window.location.reload(true);
              }
              setTimeout(function () {
                reloadConfirmationDialogIsDisplayed = false;
              }, 0);
            }
          }
          return true;

        } else if (message.debug.errors) {
          var errorsText = message.debug.errors.join('');
          console.error(errorsText);
          window.alert(errorsText);
          return true;
        }
      }

      return false;
    }
  };
}


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

  if (!wsSend(
    { debug:
      { time: new Date().valueOf(),

        message: Object.keys(args)
          .map(function (key) {
            return args[key];
          })
      }
    }
  )) {
    // TODO: store before reconnect
    // originalConsoleLog.call(console, e);
  }

  originalConsoleLog.apply(console, arguments);
};


console.log('DEBUG MODE ENABLED');

module.exports = initDebug;

