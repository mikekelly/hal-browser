HAL.Browser = Backbone.Router.extend({
  initialize: function(opts) {
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

    if (window.location.hash === '') {
      window.location.hash = this.entryPoint;
    }
  },

  routes: {
    '*url': 'resourceRoute'
  },

  resourceRoute: function(url) {
    url = location.hash.slice(1);
    console.log('target url changed to: ' + url);
    if (url.slice(0,8) !== 'NON-GET:') {
      HAL.client.get(url);
    }
  }
});
