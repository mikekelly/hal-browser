HAL.Views.NonSafeRequestDialog = Backbone.View.extend({
  initialize: function(opts) {
    this.href = opts.href;
    this.vent = opts.vent;
    this.attrs = opts.attrs;
    this.uriTemplate = uritemplate(this.href);
    _.bindAll(this, 'submitQuery');
  },

  events: {
    'submit form': 'submitQuery'
  },

  className: 'modal fade',

  submitQuery: function(e) {
    e.preventDefault();

    var self = this,
        opts = {
          url: this.$('.url').val().split('{')[0], // strip of URI Template variables for non-GET ops
          headers: HAL.parseHeaders(this.$('.headers').val()),
          method:  this.$('.method').val(),
          data: this.$('.body').val()
        };

    // If there is a customPost form, then use its special data extraction function and override opts.data
    if (HAL.customPost) {
      opts.data = HAL.customPost.extractData(this.attrs);
    }

    var request = HAL.client.request(opts);
    request.done(function(response) {
      self.vent.trigger('response', { resource: response, jqxhr: jqxhr });
    }).fail(function(response) {
      self.vent.trigger('fail-response', { jqxhr: jqxhr });
    }).always(function() {
      self.vent.trigger('response-headers', { jqxhr: jqxhr });
      window.location.hash = 'NON-GET:' + opts.url;
    });

    this.$el.modal('hide');
  },

  render: function(opts) {
    var headers = HAL.client.getHeaders(),
        headersString = '';

    _.each(headers, function(value, name) {
      headersString += name + ': ' + value + '\n';
    });

    this.$el.html(this.template({ href: this.href, user_defined_headers: headersString, attrs: this.attrs }));
    this.$el.modal();
    return this;
  },

  template: _.template($('#non-safe-request-template').html())
});
