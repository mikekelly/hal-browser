(function() {
  var HAL = {
    Models: {},
    Views: {},
    currentDocument: {},
    jsonIndent: 2,
  };

  HAL.client = function(opts) {
    this.vent = opts.vent;
    this.headers = HAL.parseHeaders($('#request-headers').val());
    this.get = function(url) {
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
  };

  HAL.Router = Backbone.Router.extend({
    initialize: function(opts) {
      var self = this;
      opts = opts || {};

      var vent = _.extend({}, Backbone.Events);

      vent.bind('response', function(e) {
        window.HAL.currentDocument = e.resource || {};
      });

      this.client = new HAL.client({ vent: vent });

      $.ajaxSetup({ headers: { 'Accept': 'application/hal+json, application/json, */*; q=0.01' } });

      this.browser = new HAL.Views.Browser({ el: $('#browser'), vent: vent });
      this.inspectorView = new HAL.Views.Inspector({ el: $('#inspector'), vent: vent });

      if (window.location.hash === '') {
        var entry = opts.entryPoint || '/';
        window.location.hash = entry;
      }
    },

    routes: {
      '*url': 'resourceRoute'
    },

    resourceRoute: function(url) {
      url = location.hash.slice(1);
      if (url.slice(0,8) !== 'NON-GET:') {
        this.client.get(url);
      }
    }
  });

  HAL.Models.Resource = Backbone.Model.extend({
    initialize: function(representation) {
      this.links = representation._links;
      if(representation._embedded !== undefined) {
        this.embeddedResources = this.buildEmbeddedResources(representation._embedded);
      }
      this.set(representation);
      this.unset('_embedded', { silent: true });
      this.unset('_links', { silent: true });
    },

    buildEmbeddedResources: function(embeddedResources) {
      var result = {};
      _.each(embeddedResources, function(obj, rel) {
        if($.isArray(obj)) {
          var arr = [];
          _.each(obj, function(resource, i) {
            var newResource = new HAL.Models.Resource(resource);
            newResource.identifier = rel + '[' + i + ']';
            newResource.embed_rel = rel;
            arr.push(newResource);
          });
          result[rel] = arr;
        } else {
          var newResource = new HAL.Models.Resource(obj);
          newResource.identifier = rel;
          newResource.embed_rel = rel;
          result[rel] = newResource;
        }
      });
      return result;
    }
  });

  HAL.Views.Browser = Backbone.View.extend({
    initialize: function(opts) {
      var self = this;
      this.vent = opts.vent;
      this.locationBar = new HAL.Views.LocationBar({ el: this.$('#location-bar'), vent: this.vent });
      this.resourceView = new HAL.Views.Resource({ el: this.$('#current-resource'), vent: this.vent });
    },

    events: {
      'blur #request-headers': 'updateRequestHeaders'
    },

    updateRequestHeaders: function(e) {
      var headers = HAL.parseHeaders(this.$('#request-headers').val());
      $.ajaxSetup({ headers: headers });
    }
  });

  HAL.Views.Resource = Backbone.View.extend({
    initialize: function(opts) {
      var self = this;
      this.vent = opts.vent;
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
      this.$el.html(this.template({
        state: resource.toJSON(),
        links: resource.links
      }));
      var $embres = this.$('.embedded-resources');
      $embres.html(this.renderEmbeddedResources(resource.embeddedResources));
      $embres.accordion();
      return this;
    },

    followLink: function(e) {
      e.preventDefault();
      var $target = $(e.target);
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
      window.foo = d;
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

  HAL.Views.LocationBar = Backbone.View.extend({
    initialize: function(opts) {
      var self = this;
      this.vent = opts.vent;
      this.vent.bind('location-change', function(e) {
        self.setLocation(e.url);
      });
    },

    setLocation: function(url) {
      this.address.html(url);
    },

    address: $('.address')
  });

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

  HAL.Views.QueryUriDialog = Backbone.View.extend({
    initialize: function(opts) {
      this.href = opts.href;
      this.uriTemplate = uritemplate(this.href);
      _.bindAll(this, 'submitQuery');
      _.bindAll(this, 'renderPreview');
    },

    events: {
      'submit form': 'submitQuery',
      'keyup textarea': 'renderPreview',
      'change textarea': 'renderPreview'
    },

    submitQuery: function(e) {
      e.preventDefault();
      var input;
      try {
        input = JSON.parse(this.$('textarea').val());
      } catch(err) {
        input = {};
      }
      this.$el.dialog('close');
      window.location.hash = this.uriTemplate.expand(input);
    },

    renderPreview: function(e) {
      var input, result;
      try {
        input = JSON.parse($(e.target).val());
        result = this.uriTemplate.expand(input);
      } catch (err) {
        result = 'Invalid json input';
      }
      this.$('.preview').html(result);
    },

    render: function() {
      this.$el.html(this.template({ href: this.href }));
      this.$('textarea').trigger('keyup');
      return this;
    },

    template: _.template($('#query-uri-template').html())
  });

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

    render: function() {
      this.$el.html(this.template({ href: this.href, user_defined_headers: $('#request-headers').val() }));
      return this;
    },

    template: _.template($('#non-safe-request-template').html())
  });

  var urlRegex = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

  HAL.isUrl = function(str) {
    return str.match(urlRegex) || isCurie(str);
  };

  HAL.truncateIfUrl = function(str) {
    var replaceRegex = /(http|https):\/\/([^\/]*)\//;
    return str.replace(replaceRegex, '.../');
  };

  var isCurie = function(string) {
    return string.split(':').length > 1;
  };

  HAL.buildUrl = function(rel) {
    if (!rel.match(urlRegex) && isCurie(rel) && HAL.currentDocument._links.curies) {
      var parts = rel.split(':');
      var curies = HAL.currentDocument._links.curies;
      for (var i=0; i<curies.length; i++) {
        if (curies[i].name == parts[0]) {
          var tmpl = uritemplate(curies[i].href);
          return tmpl.expand({ rel: parts[1] });
        }
      }
    }
    // Backward compatible with <04 version of spec.
    else if (!rel.match(urlRegex) && isCurie(rel) && HAL.currentDocument._links.curie) {
      var tmpl = uritemplate(HAL.currentDocument._links.curie.href);
      return tmpl.expand({ rel: rel.split(':')[1] });
    }
    // End BC.
    else {
      return rel;
    }
  };

  HAL.parseHeaders = function(string) {
    var header_lines = string.split("\n");
    var headers = {};
    _.each(header_lines, function(line) {
      var parts = line.split(':');
      if (parts.length > 1) {
        var name = parts.shift().trim();
        var value = parts.join(':').trim();
        headers[name] = value;
      }
    });
    return headers;
  };

  window.HAL = HAL;
})();
