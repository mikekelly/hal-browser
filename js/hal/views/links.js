HAL.Views.Links = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
  },

  events: {
    'click .follow': 'followLink',
    'click .follow-delete': 'followLinkDelete',
    'click .non-get': 'showNonSafeRequestDialog',
    'click .query': 'showUriQueryDialog',
    'click .dox': 'showDocs'
  },

  className: 'links',

  followLink: function(e) {
    e.preventDefault();
    var $target = $(e.currentTarget);
    var uri = $target.attr('href');
    window.location.hash = uri;
  },

  followLinkDelete: function(e) {
    e.preventDefault();
    var self = this, opts = {
      url: $(e.currentTarget).attr('href'),
      method:  'DELETE'
    };
    var request = HAL.client.request(opts);
    request.done(function(response) {
      self.vent.trigger('response', { resource: response, jqxhr: jqxhr });
    }).fail(function(response) {
      self.vent.trigger('fail-response', { jqxhr: jqxhr });
    }).always(function() {
      self.vent.trigger('response-headers', { jqxhr: jqxhr });
      window.location.hash = 'NON-GET:' + opts.url;
    });
  },

  showUriQueryDialog: function(e) {
    e.preventDefault();

    var $target = $(e.currentTarget);
    var uri = $target.attr('href');

    new HAL.Views.QueryUriDialog({
      href: uri
    }).render({});
  },

  showNonSafeRequestDialog: function(e) {
    e.preventDefault();

    var postForm = (HAL.customPostForm !== undefined) ? HAL.customPostForm : HAL.Views.NonSafeRequestDialog;
    var d = new postForm({
      href: $(e.currentTarget).attr('href'),
      vent: this.vent
    }).render({})
  },

  showDocs: function(e) {
    e.preventDefault();
    var $target = $(e.target);
    var uri = $target.attr('href') || $target.parent().attr('href');
    this.vent.trigger('show-docs', { url: uri });
  },

  template: _.template($('#links-template').html()),

  render: function(links) {
    this.$el.html(this.template({ links: links }));
  }
});
