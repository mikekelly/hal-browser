HAL.Views.Inspector = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;

    _.bindAll(this, 'renderDocumentation');
    _.bindAll(this, 'renderResponse');

    this.responseView = new HAL.Views.Response({ vent: this.vent });
    this.docView = new HAL.Views.Documenation({ vent: this.vent });

    this.vent.bind('show-docs', this.renderDocumentation);
    this.vent.bind('response', this.renderResponse);
  },

  className: 'inspector span6',

  render: function() {
    this.$el.html(this.template());
  },

  renderResponse: function(response) {
    this.render();
    this.responseView.render(response);

    this.$el.append(this.responseView.el);
  },

  renderDocumentation: function(url) {
    this.render();
    this.docView.render(url);

    this.$el.append(this.docView);
  },

  template: function() {
    return '<h1>Inspector</h1>';
  }
});
