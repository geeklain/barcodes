define(function() {

  var _resolvers = {};

  return {
    /**
     * Only method required so this can work as requireJS plugin.
     * @param name GWT module name
     * @param require a local require method
     * @param onload the onload callback
     * @param config some config
     */
    load: function (name, require, onload, config) {
      // create a promise for the module
      var promise = new Promise(function(resolve) {
        // hold the resolve method for later
        _resolvers[name] = resolve;
      });

      // when the promise resolves, call the onlaod callback
      promise.then(function(exports) {
        onload(exports);
      });
      // start loading the GWT module in 2 steps (helper + permutation
      require([name + '/' + name + '.nocache']);
    },

    /**
     * Method called by GWT modules when they finish bootstrapping.
     * @param name GWT module name
     * @param exports artifacts exported by the module
     */
    moduleLoaded: function(name, exports) {
      var resolver = _resolvers[name];
      if (!resolver) {
        throw new Error('Module name is not known: ' + name);
      }
      // resolve this module promise
      resolver(exports);
    },
  };
});