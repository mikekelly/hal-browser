HAL.Views.Browser = Backbone.View.extend({
  initialize: function(opts) {
    var self = this;
    this.vent = opts.vent;
    this.locationBar = new HAL.Views.LocationBar({ el: this.$('#location-bar'), vent: this.vent });
    this.resourceView = new HAL.Views.Resource({ el: this.$('#current-resource'), vent: this.vent });
  },

  events: {
    'blur #request-headers': 'updateRequestHeaders'
  },

  updateRequestHeaders: function(e) {
    var headers = HAL.parseHeaders(this.$('#request-headers').val());
    $.ajaxSetup({ headers: headers });
  }
});
