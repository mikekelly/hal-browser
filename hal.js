(function() {
  var urlRegex = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

  function isCurie(string) {
    return string.split(':').length > 1;
  };

  var HAL = {
    Models: {},
    Views: {},
    Http: {},
    currentDocument: {},
    jsonIndent: 2,
    isUrl: function(str) {
      return str.match(urlRegex) || isCurie(str);
    },
    truncateIfUrl: function(str) {
      var replaceRegex = /(http|https):\/\/([^\/]*)\//;
        return str.replace(replaceRegex, '.../');
    },
    buildUrl: function(rel) {
      if (!rel.match(urlRegex) && isCurie(rel) && HAL.currentDocument._links.curies) {
        var parts = rel.split(':');
        var curies = HAL.currentDocument._links.curies;
        for (var i=0; i<curies.length; i++) {
          if (curies[i].name == parts[0]) {
            var tmpl = urltemplate.parse(curies[i].href);
            return tmpl.expand({ rel: parts[1] });
          }
        }
      }
      else if (!rel.match(urlRegex) && isCurie(rel) && HAL.currentDocument._links.curie) {
        // Backward compatibility with <04 version of spec.
        var tmpl = urltemplate.parse(HAL.currentDocument._links.curie.href);
        return tmpl.expand({ rel: rel.split(':')[1] });
      }
      else {
        return rel;
      }
    },
    parseHeaders: function(string) {
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
    },
  };

  window.HAL = HAL;
})();
;HAL.Browser = Backbone.Router.extend({
  initialize: function(opts) {
    opts = opts || {};

    var vent = _.extend({}, Backbone.Events),
    $container = opts.container || $('#browser');

    this.entryPoint = opts.entryPoint || '/';

    // TODO: don't hang currentDoc off namespace
    vent.bind('response', function(e) {
      window.HAL.currentDocument = e.resource || {};
    });

    vent.bind('location-go', _.bind(this.loadUrl, this));

    HAL.client = new HAL.Http.Client({ vent: vent });

    var browser = new HAL.Views.Browser({ vent: vent, entryPoint: this.entryPoint });
    browser.render()

    $container.html(browser.el);
    vent.trigger('app:loaded');

    if (window.location.hash === '') {
      window.location.hash = this.entryPoint;
    }

    if(location.hash.slice(1,9) === 'NON-GET:') {
      new HAL.Views.NonSafeRequestDialog({
            href: location.hash.slice(9),
            vent: vent
          }).render({});
    }
  },

  routes: {
    '*url': 'resourceRoute'
  },

  loadUrl: function(url) {
    if (this.getHash() === url) {
      HAL.client.get(url);
    } else {
      window.location.hash = url;
    }
  },

  getHash: function() {
    return window.location.hash.slice(1);
  },

  resourceRoute: function() {
    url = location.hash.slice(1);
    console.log('target url changed to: ' + url);
    if (url.slice(0,8) !== 'NON-GET:') {
      HAL.client.get(url);
    }
  }
});
;HAL.Http.Client = function(opts) {
  this.vent = opts.vent;
  $.ajaxSetup({ headers: { 'Accept': 'application/hal+json, application/json, */*; q=0.01' } });
};

HAL.Http.Client.prototype.get = function(url) {
  var self = this;
  this.vent.trigger('location-change', { url: url });
  var jqxhr = $.ajax({
    url: url,
    dataType: 'json',
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
;HAL.Models.Resource = Backbone.Model.extend({
  initialize: function(representation) {
    representation = representation || {};
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
;HAL.Views.Browser = Backbone.View.extend({
  initialize: function(opts) {
    var self = this;
    this.vent = opts.vent;
    this.entryPoint = opts.entryPoint;
    this.explorerView = new HAL.Views.Explorer({ vent: this.vent });
    this.inspectorView = new HAL.Views.Inspector({ vent: this.vent });
  },

  className: 'hal-browser row-fluid',

  render: function() {
    this.$el.empty();

    this.inspectorView.render();
    this.explorerView.render();

    this.$el.html(this.explorerView.el);
    this.$el.append(this.inspectorView.el);

    var entryPoint = this.entryPoint;

    $("#entryPointLink").click(function(event) {
      event.preventDefault();
      window.location.hash = entryPoint;
    });
    return this;
  }
});
;HAL.Views.Documenation = Backbone.View.extend({
  className: 'documentation',

  render: function(url) {
    this.$el.html('<iframe src=' + url + '></iframe>');
  }
});
;HAL.Views.EmbeddedResource = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
    this.resource = opts.resource;

    this.propertiesView = new HAL.Views.Properties({});
    this.linksView = new HAL.Views.Links({
      vent: this.vent
    });

    _.bindAll(this, 'onToggleClick');
    _.bindAll(this, 'onDoxClick');
  },

  events: {
    'click a.accordion-toggle': 'onToggleClick',
    'click span.dox': 'onDoxClick'
  },

  className: 'embedded-resource accordion-group',

  onToggleClick: function(e) {
    e.preventDefault();
    this.$accordionBody.collapse('toggle');
  },
  
  onDoxClick: function(e) {
    e.preventDefault();
    this.vent.trigger('show-docs', {
      url: $(e.currentTarget).data('href')
    });
    return false;
  },

  render: function() {
    this.$el.empty();

    this.propertiesView.render(this.resource.toJSON());
    this.linksView.render(this.resource.links);

    this.$el.append(this.template({
      resource: this.resource
    }));

    var $inner = $('<div class="accordion-inner"></div>');
    $inner.append(this.propertiesView.el);
    $inner.append(this.linksView.el);

    this.$accordionBody = $('<div class="accordion-body collapse"></div>');
    this.$accordionBody.append($inner)

    this.$el.append(this.$accordionBody);
  },

  template: _.template($('#embedded-resource-template').html())
});
;HAL.Views.EmbeddedResources = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
    _.bindAll(this, 'render');
  },

  className: 'embedded-resources accordion',

  render: function(resources) {
    var self = this,
        resourceViews = [],
        buildView = function(resource) {
          return new HAL.Views.EmbeddedResource({
            resource: resource,
            vent: self.vent
          });
        };

    _.each(resources, function(prop) {
      if ($.isArray(prop)) {
        _.each(prop, function(resource) {
          resourceViews.push(buildView(resource));
        });
      } else {
        resourceViews.push(buildView(prop));
      }
    });

    this.$el.html(this.template());

    _.each(resourceViews, function(view) {
      view.render();
      self.$el.append(view.el);
    });


    return this;
  },

  template: _.template($('#embedded-resources-template').html())
});
;HAL.Views.Explorer = Backbone.View.extend({
  initialize: function(opts) {
    var self = this;
    this.vent = opts.vent;
    this.navigationView = new HAL.Views.Navigation({ vent: this.vent });
    this.resourceView = new HAL.Views.Resource({ vent: this.vent });
  },

  className: 'explorer col-md-6',

  render: function() {
    this.navigationView.render();

    this.$el.html(this.template());

    this.$el.append(this.navigationView.el);
    this.$el.append(this.resourceView.el);
  },

  template: function() {
    return '';
  }
});
;HAL.Views.Inspector = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;

    _.bindAll(this, 'renderDocumentation');
    _.bindAll(this, 'renderResponse');

    this.vent.bind('show-docs', this.renderDocumentation);
    this.vent.bind('response', this.renderResponse);
  },

  className: 'inspector col-md-6',

  render: function() {
    this.$el.html(this.template());
  },

  renderResponse: function(response) {
    var responseView = new HAL.Views.Response({ vent: this.vent });

    this.render();
    responseView.render(response);

    this.$el.append(responseView.el);
  },

  renderDocumentation: function(e) {
    var docView = new HAL.Views.Documenation({ vent: this.vent });

    this.render();
    docView.render(e.url);

    this.$el.append(docView.el);
  },

  template: function() {
    return '';
  }
});
;HAL.Views.Links = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
  },

  events: {
    'click .follow': 'followLink',
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

    var d = new HAL.Views.NonSafeRequestDialog({
      href: $(e.currentTarget).attr('href'),
      vent: this.vent
    }).render({});
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
;HAL.Views.LocationBar = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
    _.bindAll(this, 'render');
    _.bindAll(this, 'onButtonClick');
    this.vent.bind('location-change', this.render);
    this.vent.bind('location-change', _.bind(this.showSpinner, this));
    this.vent.bind('response', _.bind(this.hideSpinner, this));
  },

  events: {
    'submit form': 'onButtonClick'
  },

  className: 'address clearfix',
  id: 'location-bar',

  render: function(e) {
    e = e || { url: '' };
    this.$el.html(this.template(e));
  },

  onButtonClick: function(e) {
    e.preventDefault();
    this.vent.trigger('location-go', this.getLocation());
  },

  getLocation: function() {
    return this.$el.find('input').val();
  },

  showSpinner: function() {
    this.$el.find('.ajax-loader').addClass('visible');
  },

  hideSpinner: function() {
    this.$el.find('.ajax-loader').removeClass('visible');
  },

  template: _.template($('#location-bar-template').html())
});
;HAL.Views.Navigation = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
    this.locationBar = new HAL.Views.LocationBar({ vent: this.vent });
    this.requestHeadersView = new HAL.Views.RequestHeaders({ vent: this.vent });
  },

  className: 'navigation',

  render: function() {
    this.$el.empty();

    this.locationBar.render();
    this.requestHeadersView.render();

    this.$el.append(this.locationBar.el);
    this.$el.append(this.requestHeadersView.el);
  }
});
;HAL.Views.NonSafeRequestDialog = Backbone.View.extend({
  initialize: function(opts) {
    this.href = opts.href;
    this.vent = opts.vent;
    this.uriTemplate = urltemplate.parse(this.href);
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
          url: this.$('.url').val(),
          headers: HAL.parseHeaders(this.$('.headers').val()),
          method:  this.$('.method').val(),
          data: this.$('.body').val()
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

    this.$el.modal('hide');
  },

  render: function(opts) {
    var headers = HAL.client.getDefaultHeaders(),
        headersString = '';

    _.each(headers, function(value, name) {
      headersString += name + ': ' + value + '\n';
    });

    this.$el.html(this.template({ href: this.href, user_defined_headers: headersString }));
    this.$el.modal();
    return this;
  },

  template: _.template($('#non-safe-request-template').html())
});
;HAL.Views.Properties = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
    _.bindAll(this, 'render');
  },

  className: 'properties',

  render: function(props) {
    this.$el.html(this.template({ properties: props }));
  },

  template: _.template($('#properties-template').html())
});
;HAL.Views.QueryUriDialog = Backbone.View.extend({
  initialize: function(opts) {
    this.href = opts.href;
    this.uriTemplate = urltemplate.parse(this.href);
    _.bindAll(this, 'submitQuery');
    _.bindAll(this, 'renderPreview');
  },

  className: 'modal fade',

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
    this.$el.modal('hide');
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

  extractExpressionNames: function (template) {
    var names = [];
    // TODO: Reinstate this code using a URI template lib
    // that gives us the variable names

    //for (var i=0; i<template.set.length; i++) {
      //if (template.set[i].vars) {
        //for (var j=0; j<template.set[i].vars.length; j++) {
          //names.push(template.set[i].vars[j].name);
        //}
      //}
    //}
    return names;
  },

  createDefaultInput: function (expressionNames) {
    var defaultInput = {};
    for (var i=0; i<expressionNames.length; i++) {
      defaultInput[expressionNames[i]] = '';
    }
    return JSON.stringify(defaultInput, null, HAL.jsonIndent);
  },

  render: function(opts) {
    var input = this.createDefaultInput(this.extractExpressionNames(this.uriTemplate));
    this.$el.html(this.template({ href: this.href, input: input }));
    this.$('textarea').trigger('keyup');
    this.$el.modal(opts);
    return this;
  },

  template: _.template($('#query-uri-template').html())
});
;HAL.Views.RequestHeaders = Backbone.View.extend({
  initialize: function(opts) {
    var self = this;
    this.vent = opts.vent;

    _.bindAll(this, 'updateRequestHeaders');

    this.vent.bind('app:loaded', function() {
      self.updateRequestHeaders();
    });
  },

  className: 'request-headers',

  events: {
    'blur textarea': 'updateRequestHeaders'
  },

  updateRequestHeaders: function(e) {
    var inputText = this.$('textarea').val() || '';
        headers = HAL.parseHeaders(inputText);
    HAL.client.updateDefaultHeaders(headers)
  },

  render: function() {
    this.$el.html(this.template());
  },

  template: _.template($('#request-headers-template').html())
});
;HAL.Views.Resource = Backbone.View.extend({
  initialize: function(opts) {
    var self = this;

    this.vent = opts.vent;

    this.vent.bind('response', function(e) {
      self.render(new HAL.Models.Resource(e.resource));
    });

    this.vent.bind('fail-response', function(e) {
      self.vent.trigger('response', { resource: null, jqxhr: e.jqxhr });
    });
  },

  className: 'resource',

  render: function(resource) {
    var linksView = new HAL.Views.Links({ vent: this.vent }),
        propertiesView = new HAL.Views.Properties({ vent: this.vent }),
        embeddedResourcesView 

    propertiesView.render(resource.toJSON());
    linksView.render(resource.links);

    this.$el.empty();
    this.$el.append(propertiesView.el);
    this.$el.append(linksView.el);

    if (resource.embeddedResources) {
      embeddedResourcesView = new HAL.Views.EmbeddedResources({ vent: this.vent });
      embeddedResourcesView.render(resource.embeddedResources);
      this.$el.append(embeddedResourcesView.el);
    }

    return this;
  }
});
;HAL.Views.Response = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;

    this.headersView = new HAL.Views.ResponseHeaders({ vent: this.vent });
    this.bodyView = new HAL.Views.ResponseBody({ vent: this.vent });

    _.bindAll(this, 'render');

    this.vent.bind('response', this.render);
  },

  className: 'response',

  render: function(e) {
    this.$el.html();

    this.headersView.render(e);
    this.bodyView.render(e);

    this.$el.append(this.headersView.el);
    this.$el.append(this.bodyView.el);
  }
});
;HAL.Views.ResponseBody = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
  },

  className: 'response-headers',

  render: function(e) {
    this.$el.html(this.template({
      body: this._bodyAsStringFromEvent(e)
    }));
  },

  template: _.template($('#response-body-template').html()),

  _bodyAsStringFromEvent: function(e) {
    var output = 'n/a';
    if(e.resource !== null) {
      output = JSON.stringify(e.resource, null, HAL.jsonIndent);
    } else {
      // The Ajax request "failed", but there may still be an
      // interesting response body (possibly JSON) to show.
      var content_type = e.jqxhr.getResponseHeader('content-type');
      var responseText = e.jqxhr.responseText;
      if(content_type == null || content_type.indexOf('text/') == 0) {
        output = responseText;
      } else if(content_type.indexOf('json') != -1) {
        // Looks like json... try to parse it.
        try {
          var obj = JSON.parse(responseText);
          output = JSON.stringify(obj, null, HAL.jsonIndent);
        } catch (err) {
          // JSON parse failed. Just show the raw text.
          output = responseText;
        }
      }
    }
    return output
  }
});
;HAL.Views.ResponseHeaders = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
  },

  className: 'response-headers',

  render: function(e) {
    this.$el.html(this.template({
      status: {
        code: e.jqxhr.status,
        text: e.jqxhr.statusText
      },
      headers: e.jqxhr.getAllResponseHeaders()
    }));
  },

  template: _.template($('#response-headers-template').html())
});
