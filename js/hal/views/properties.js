HAL.Views.Properties = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
    _.bindAll(this, 'render');
  },

  className: 'properties',

  render: function(properties) {
    this.$el.html(this.template(properties));
  },

  template: _.template($('#properties-template').html())
});
