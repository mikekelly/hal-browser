HAL.Views.EmbeddedResources = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
  },

  className: 'embedded-resources',

  render: function(resources) {
    var self = this,
        resourceViews = [],
        buildView = function(resource) {
          return new HAL.Views.EmbeddedResource({
            properties: resource.toJSON(),
            links: resource.links,
            name: resource.identifier,
            embed_rel: resource.embed_rel
          })
        };

    _.each(resources, function(prop) {
      if ($.isArray(prop)) {
        _.each(prop, function(resource) {
          resourceViews.push(buildView(resource));
        });
      } else {
        resourceViews.push(buildView(prop));
      }
    });

    _.each(resourceViews, function(view) {
      self.$el.append(view.render());
    });

    this.$el.accordion();

    return this;
  }
});
