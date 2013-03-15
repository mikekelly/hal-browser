HAL.Views.EmbeddedResource = Backbone.View.extend({
  initialize: function(resource) {
    this.resource = resource;
    _.bindAll(this, 'render');
  },

  render: function() {
    this.$el.html(this.template({ resource: this.resource }));
  },

  template: _.template($('#embedded-resource-template').html())
});
