module.exports = {
  receive: function (message) {
    if (message.cltCodeHash) {
      window.bundleHash = message.cltCodeHash;
      return true;
    } else if (message.debug) {

      if (message.debug.file) {
        if (window.bundleHash !== message.debug.hash) {
          console.log('New file compiled', message.debug.hash,
            window.bundleHash);
          var fileStr = window.atob(message.debug.file);

          window.bundleHash = message.debug.hash;
          eval(fileStr);
        }

        return true;
      }
    }

    return false;
  }
};

