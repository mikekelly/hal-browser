HAL.Http.Client = function(opts) {
  this.vent = opts.vent;
  $.ajaxSetup({ headers: { 'Accept': 'application/hal+json, application/json, */*; q=0.01' } });
};

HAL.Http.Client.prototype.getUsername = function() {
    return this.username;
};

HAL.Http.Client.prototype.getPassword = function() {
    return this.password;
};

HAL.Http.Client.prototype.get = function(url) {
  var self = this;
  var withCreds;
  if (!this.username || !this.password) {
      this.username = $("#username").val();
      this.password = $("#password").val();
  }

  this.vent.trigger('location-change', { url: url });
  var jqxhr = $.ajax({
    url: url,
    dataType: 'json',
    beforeSend: function (xhr) {
        if (self.username && self.password  && $('#useCreds').is(':checked')) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(self.username + ":" + self.password));
        }
    },
    success: function(resource, textStatus, jqXHR) {
      self.vent.trigger('response', {
        resource: resource,
        jqxhr: jqXHR,
        headers: jqXHR.getAllResponseHeaders()
      });
    }
  }).error(function() {
    self.vent.trigger('fail-response', { jqxhr: jqxhr });
  });
};

HAL.Http.Client.prototype.request = function(opts) {
  var self = this;
  opts.dataType = 'json';
  self.vent.trigger('location-change', { url: opts.url });
  return jqxhr = $.ajax(opts);
};

HAL.Http.Client.prototype.updateDefaultHeaders = function(headers) {
  this.defaultHeaders = headers;
  $.ajaxSetup({ headers: headers });
};

HAL.Http.Client.prototype.getDefaultHeaders = function() {
  return this.defaultHeaders;
};
