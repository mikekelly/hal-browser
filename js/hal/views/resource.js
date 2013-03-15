HAL.Views.Resource = Backbone.View.extend({
  initialize: function(opts) {
    var self = this;
    this.vent = opts.vent;

    this.propertiesView = new HAL.Views.Properties({ vent: this.vent });
    this.requestHeadersView = new HAL.Views.RequestHeaders({ vent: this.vent });
    this.linksView = new HAL.Views.Links({ vent: this.vent });
    this.embeddedResourcesView = new HAL.Views.EmbeddedResources({ vent: this.vent });

    _.bindAll(this, 'followLink');
    _.bindAll(this, 'showNonSafeRequestDialog');
    _.bindAll(this, 'showUriQueryDialog');
    _.bindAll(this, 'showDocs');

    this.vent.bind('response', function(e) {
      self.render(new HAL.Models.Resource(e.resource));
    });

    this.vent.bind('fail-response', function(e) {
      self.vent.trigger('response', { resource: null, jqxhr: e.jqxhr });
    });
  },

  events: {
    'click .links a.follow': 'followLink',
    'click .links a.non-get': 'showNonSafeRequestDialog',
    'click .links a.query': 'showUriQueryDialog',
    'click .links a.dox': 'showDocs'
  },

  render: function(resource) {
    this.$el.empty();

    this.propertiesView.render(resource.toJSON());
    this.linksView.render(resource.links);
    this.embeddedResourcesView.render(resource.embeddedResources);

    this.$el.append(this.propertiesView.el);
    this.$el.append(this.requestHeadersView.el);
    this.$el.append(this.linksView.el);
    this.$el.append(this.embeddedResourcesView.el);

    return this;
  },

  followLink: function(e) {
    e.preventDefault();
    var $target = $(target);
    var uri = $target.attr('href') || $target.parent().attr('href');
    window.location.hash = uri;
  },

  showUriQueryDialog: function(e) {
    e.preventDefault();

    var $target = $(e.target);
    var uri = $target.attr('href') || $target.parent().attr('href');

    var d = new HAL.Views.QueryUriDialog({
      href: uri
    }).render();

    d.$el.dialog({
      title: 'Query URI Template',
      width: 400
    });
  },

  showNonSafeRequestDialog: function(e) {
    e.preventDefault();

    var d = new HAL.Views.NonSafeRequestDialog({
      href: $(e.target).attr('href'),
      vent: this.vent
    }).render();

    d.$el.dialog({
      title: 'Non Safe Request',
      width: 500
    });
  },

  showDocs: function(e) {
    e.preventDefault();
    var $target = $(e.target);
    var uri = $target.attr('href') || $target.parent().attr('href');
    this.vent.trigger('show-docs', { url: uri });
  },

  renderEmbeddedResources: function(embeddedResources) {
    var self = this;
    var result = '';
    _.each(embeddedResources, function(obj) {
      if ($.isArray(obj)) {
        _.each(obj, function(resource) {
          result += self.embeddedResourceTemplate({
            state: resource.toJSON(),
            links: resource.links,
            name: resource.identifier,
            embed_rel: resource.embed_rel
          });
        });
      } else {
        result += self.embeddedResourceTemplate({
          state: obj.toJSON(),
          links: obj.links,
          name: obj.identifier,
          embed_rel: obj.embed_rel
        });
      }
    });
    return result;
  },

  template: _.template($('#resource-template').html()),

  embeddedResourceTemplate: _.template($('#embedded-resource-template').html())
});
