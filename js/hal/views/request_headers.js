HAL.Views.RequestHeaders = Backbone.View.extend({
  initialize: function(opts) {
    var self = this;
    this.vent = opts.vent;

    _.bindAll(this, 'updateRequestHeaders');

    this.vent.bind('app:loaded', function() {
      self.updateRequestHeaders();
    });
  },

  className: 'request-headers',

  events: {
    'blur textarea': 'updateRequestHeaders'
  },

  updateRequestHeaders: function(e) {
    var inputText = this.$('textarea').val() || '';
        headers = HAL.parseHeaders(inputText);
    HAL.client.updateHeaders(_.defaults(headers, HAL.client.defaultHeaders))
  },

  render: function() {
    this.$el.html(this.template());
  },

  template: _.template($('#request-headers-template').html())
});
