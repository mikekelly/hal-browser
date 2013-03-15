HAL.Views.EmbeddedResources = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
  },

  className: 'embedded-resources',

  render: function(resources) {
    this.$el.html(this.template({ resources: resources }));
    this.$el.accordion();
  },

  template: _.template($('#embedded-resources-template'));
});
