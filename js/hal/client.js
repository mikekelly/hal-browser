HAL.Client = function(opts) {
  this.vent = opts.vent;
  this.headers = HAL.parseHeaders($('#request-headers').val());
};

HAL.Client.prototype.get = function(url) {
  var self = this;
  this.vent.trigger('location-change', { url: url });
  var jqxhr = $.ajax({
    url: url,
    dataType: 'json',
    headers: this.headers,
    success: function(resource, textStatus, jqXHR) {
      self.vent.trigger('response', {
        resource: resource,
        headers: jqXHR.getAllResponseHeaders()
      });
    }
  }).error(function() {
    self.vent.trigger('fail-response', { jqxhr: jqxhr });
  }).always(function() {
    self.vent.trigger('response-headers', { jqxhr: jqxhr });
  });
};
