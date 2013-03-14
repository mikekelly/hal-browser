HAL.Http.Client = function(opts) {
  this.vent = opts.vent;
  $.ajaxSetup({ headers: { 'Accept': 'application/hal+json, application/json, */*; q=0.01' } });
  this.headers = HAL.parseHeaders($('#request-headers').val());
};

HAL.Http.Client.prototype.get = function(url) {
  console.log(url);
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

HAL.Http.Client.prototype.updateDefaultHeaders = function(headers) {
    $.ajaxSetup({ headers: headers });
};
