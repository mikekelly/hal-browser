HAL.Router = Backbone.Router.extend({
  initialize: function(opts) {
    var self = this;
    opts = opts || {};

    var vent = _.extend({}, Backbone.Events);

    vent.bind('response', function(e) {
      window.HAL.currentDocument = e.resource || {};
    });

    this.client = new HAL.Client({ vent: vent });

    $.ajaxSetup({ headers: { 'Accept': 'application/hal+json, application/json, */*; q=0.01' } });

    this.browser = new HAL.Views.Browser({ el: $('#browser'), vent: vent });
    this.inspectorView = new HAL.Views.Inspector({ el: $('#inspector'), vent: vent });

    if (window.location.hash === '') {
      var entry = opts.entryPoint || '/';
      window.location.hash = entry;
    }
  },

  routes: {
    '*url': 'resourceRoute'
  },

  resourceRoute: function(url) {
    url = location.hash.slice(1);
    if (url.slice(0,8) !== 'NON-GET:') {
      this.client.get(url);
    }
  }
});
