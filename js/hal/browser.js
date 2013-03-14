HAL.Browser = function(opts) {
  opts = opts || {};

  var vent = _.extend({}, Backbone.Events),
      $container = opts.container || $('#browser');

  this.entryPoint = opts.entryPoint || '/';

  // TODO: don't hang currentDoc off namespace
  vent.bind('response', function(e) {
    window.HAL.currentDocument = e.resource || {};
  });

  HAL.client = new HAL.Http.Client({ vent: vent });

  var browser = new HAL.Views.Browser({ vent: vent });
  browser.render()

  $container.html(browser.el);
  vent.trigger('app:loaded');
};

HAL.Browser.prototype.start = function() {
  if (window.location.hash === '') {
    HAL.client.get(this.entryPoint);
  } else {
    HAL.client.get(window.location.hash)
  }
};
