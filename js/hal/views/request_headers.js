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
        headers = this.parseHeaders(inputText);
    HAL.client.updateDefaultHeaders(headers)
  },

  parseHeaders: function(string) {
    var header_lines = string.split("\n");
    var headers = {};
    _.each(header_lines, function(line) {
      var parts = line.split(':');
      if (parts.length > 1) {
        var name = parts.shift().trim();
        var value = parts.join(':').trim();
        headers[name] = value;
      }
    });
    return headers;
  },

  render: function() {
    this.$el.html(this.template());
  },

  template: _.template($('#request-headers-template').html())
});
