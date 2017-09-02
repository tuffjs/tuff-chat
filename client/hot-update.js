module.exports = {
  receive: function (message) {
    if (message.cltCodeHash) {
      // This is unreliable. In the message, it is last compiled bundle hash;
      // Because we not packing the hash inside of our assets,
      // in rare race conditions client code and server will have different hashes.

      // window.JAVASCRIPT_BUNDLE_HASH = message.cltCodeHash;
      // Instead, we'll reload new version from server.
      return true;
    } else if (message.debug) {

      if (message.debug.file) {
        if (window.JAVASCRIPT_BUNDLE_HASH !== message.debug.hash) {
          console.log('New file compiled', message.debug.hash,
            window.JAVASCRIPT_BUNDLE_HASH);
          var fileStr = window.atob(message.debug.file);

          window.JAVASCRIPT_BUNDLE_HASH = message.debug.hash;
          eval(fileStr);
        }

        return true;
      }
    }

    return false;
  }
};

