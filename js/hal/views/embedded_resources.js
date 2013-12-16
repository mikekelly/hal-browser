HAL.Views.EmbeddedResources = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
    _.bindAll(this, 'render');
  },

  className: 'embedded-resources accordion',

  render: function(resources) {
    var self = this,
        resourceViews = [],
        buildView = function(resource) {
          return new HAL.Views.EmbeddedResource({
            index: index,
            resource: resource,
            vent: self.vent
          });
        };

    _.each(resources, function(prop) {
      if ($.isArray(prop)) {
        _.each(prop, function(resource, index) {
          resourceViews.push(buildView(resource, index));
        });
      } else {
        resourceViews.push(buildView(prop));
      }
    });

    this.$el.html(this.template());

    _.each(resourceViews, function(view) {
      view.render();
      self.$el.append(view.el);
    });


    return this;
  },

  template: _.template($('#embedded-resources-template').html())
});
