HAL.Views.ResponseHeaders = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
  },

  events: {
    'click .follow': 'followLink'
  },

  className: 'response-headers',

  followLink: function(e) {
    e.preventDefault();
    var $target = $(e.currentTarget);
    var uri = $target.attr('href');
    window.location.hash = uri;
  },

  render: function(e) {
    this.$el.html(this.template({
      status: {
        code: e.jqxhr.status,
        text: e.jqxhr.statusText
      },
      headers: HAL.parseHeaders(e.jqxhr.getAllResponseHeaders())
    }));
  },

  template: _.template($('#response-headers-template').html())
});
