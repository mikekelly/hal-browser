HAL.Views.Inspector = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
    _.bindAll(this, 'showDocs');
    _.bindAll(this, 'showRawResource');
    _.bindAll(this, 'showResponseHeaders');
    this.vent.bind('show-docs', this.showDocs);
    this.vent.bind('response', this.showRawResource);
    this.vent.bind('response-headers', this.showResponseHeaders);
  },

  responseHeadersTemplate: _.template($('#response-headers-template').html()),

  showResponseHeaders: function(e) {
    this.$('.header-panel').html(this.responseHeadersTemplate({ jqxhr: e.jqxhr }));
  },

  showDocs: function(e) {
    this.$('.body-panel').html('<iframe src=' + e.url + '></iframe>');
  },

  showRawResource: function(e) {
    var output = 'n/a';
    if(e.resource !== null) {
      output = JSON.stringify(e.resource, null, HAL.jsonIndent);
    } else {
      // The Ajax request "failed", but there may still be an
      // interesting response body (possibly JSON) to show.
      var content_type = e.jqxhr.getResponseHeader('content-type');
      var responseText = e.jqxhr.responseText;
      if(content_type.indexOf('json') != -1) {
        // Looks like json... try to parse it.
        try {
          var obj = JSON.parse(responseText);
          output = JSON.stringify(obj, null, HAL.jsonIndent);
        } catch (err) {
          // JSON parse failed. Just show the raw text.
          output = responseText;
        }
      } else if(content_type.indexOf('text/') == 0) {
        output = responseText;
      }
    }
    this.$('.body-panel').html('<pre>' + _.escape(output) + '</pre>');
  }
});
