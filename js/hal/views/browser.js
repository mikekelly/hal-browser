HAL.Views.Browser = Backbone.View.extend({
  initialize: function(opts) {
    var self = this;
    this.vent = opts.vent;
    this.locationBar = new HAL.Views.LocationBar({ vent: this.vent });
    this.resourceView = new HAL.Views.Resource({ vent: this.vent });
    this.inspectorView = new HAL.Views.InspectorView({ vent: this.vent });
  },

  className: 'hal-browser',

  render: function() {
    this.locationBar.render();
    this.resourceView.render();
    this.inspectorView.render();

    this.$el.empty();
    this.$el.append(this.locationBar.el);
    this.$el.append(this.resourceView.el);
    this.$el.append(this.inspectorView.el);
  },
});
