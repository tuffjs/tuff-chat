module.exports = function create(parent, definition) {

  // If base class has no constructor, we provide one to promote
  // style with parent initialization.
  var parentConstructor = parent.init || function () {};

  // Also we support inheriting from Function-defined classes
  // which usually created by "new".
  if (typeof(parent) == 'function') {
    parentConstructor = parent;
    parent = parent.prototype;
  }

  if (!definition) {
    return Object.create(parent);

  } else {
    var properties = {};
    for (var propertyName in definition) {
      properties[propertyName] = {
        configurable: true,
        enumerable: true,
        writable: true,
        value: (function (value) {
          if (typeof(value) != 'function') {
            return value;
          } else {
            if (propertyName != 'init') {
              return function () {
              
                var mainArguments = Array.prototype.slice.call(arguments);
                // Add this as first argument named 'self'
                mainArguments.unshift(this);
                return value.apply(this, mainArguments);
              };
            } else {
              return function tuffObject () {
                var mainArguments = Array.prototype.slice.call(arguments);
                mainArguments.unshift(parentConstructor);
                mainArguments.unshift(this);
                value.apply(this, mainArguments);
                return this;
              };
            }
          }
        })(definition[propertyName])
      };
    }
    return Object.create(parent, properties);
  }
};
