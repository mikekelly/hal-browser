HAL.Views.RequestHeaders = Backbone.View.extend({
  initialize: function(opts) {
    var self = this;
    this.vent = opts.vent;

    this.vent.bind('app:loaded', function() {
      self.updateDefaultHeaders();
    });
  },

  events: {
    'blur textarea': 'updateRequestHeaders'
  },

  updateRequestHeaders: function(e) {
    var headers = HAL.parseHeaders(this.$('textarea').val());
    HAL.client.updateDefaultHeaders(headers)
  }
});
