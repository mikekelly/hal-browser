HAL.Views.LocationBar = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
    _.bindAll(this, 'render');
    _.bindAll(this, 'onButtonClick');
    this.vent.bind('location-change', this.render);
  },

  events: {
    'submit form': 'onButtonClick'
  },

  className: 'address',

  render: function(e) {
    e = e || { url: '' };
    this.$el.html(this.template(e));
  },

  onButtonClick: function(e) {
    e.preventDefault();
    window.location.hash = this.getLocation();
  },

  getLocation: function() {
    return this.$el.find('input').val();
  },

  template: _.template($('#location-bar-template').html())
});
