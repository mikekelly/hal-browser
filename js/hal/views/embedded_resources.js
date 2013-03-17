HAL.Views.EmbeddedResources = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
    _.bindAll(this, 'render');
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

    this.$el.html(this.template());

    _.each(resourceViews, function(view) {
      view.render();
      self.$el.append(view.el());
    });

    return this;
  },

  template: _.template($('#embedded-resources-template').html())
});
