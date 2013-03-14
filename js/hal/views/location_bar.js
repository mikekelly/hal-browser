HAL.Views.LocationBar = Backbone.View.extend({
  initialize: function(opts) {
    var self = this;
    this.vent = opts.vent;
    this.vent.bind('location-change', function(e) {
      self.setLocation(e.url);
    });
  },

  className: 'address',

  setLocation: function(url) {
    this.$el.html(url);
  }
});
