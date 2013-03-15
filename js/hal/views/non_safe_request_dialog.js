HAL.Views.NonSafeRequestDialog = Backbone.View.extend({
  initialize: function(opts) {
    this.href = opts.href;
    this.vent = opts.vent;
    this.uriTemplate = uritemplate(this.href);
    _.bindAll(this, 'submitQuery');
  },

  events: {
    'submit form': 'submitQuery'
  },

  headers: function() {
    return HAL.parseHeaders(this.$('.headers').val());
  },

  submitQuery: function(e) {
    e.preventDefault();
    var self = this;
    var headers = this.headers();
    var method = this.$('.method').val();
    var body = this.$('.body').val();
    var jqxhr = $.ajax({
      url: this.href,
      dataType: 'json',
      type: method,
      headers: headers,
      data: body
    }).done(function(response) {
      self.vent.trigger('response', { resource: response });
    }).fail(function(response) {
      self.vent.trigger('fail-response', { jqxhr: jqxhr });
    }).always(function() {
      self.vent.trigger('response-headers', { jqxhr: jqxhr });
      self.vent.trigger('location-change', { url: self.href });
      window.location.hash = 'NON-GET:' + self.href;
    });
    this.$el.dialog('close');
  },

  render: function(opts) {
    this.$el.html(this.template({ href: this.href, user_defined_headers: $('#request-headers').val() }));
    this.$el.dialog(opts);
    return this;
  },

  template: _.template($('#non-safe-request-template').html())
});
