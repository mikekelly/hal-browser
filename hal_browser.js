(function() {
  var HAL = {
    Models: {},
    Views: {}
  };


  HAL.Router = Backbone.Router.extend({
    initialize: function(opts) {
      var self = this;
      opts = opts || {};

      $.ajaxSetup({ headers: { 'Accept': 'application/hal+json, application/json, */*; q=0.01' } });

      this.browser = new HAL.Views.Browser({ el: $('#browser') });
      this.inspectorView = new HAL.Views.Inspector({ el: $('#inspector') });

      this.browser.bind('show-docs', function(e) {
        self.inspectorView.showDocs(e);
      });
      this.browser.bind('render-resource', function(e) {
        self.inspectorView.showRawResource(e);
      });

      if (window.location.hash === '') {
        var entry = opts.entryPoint || '/';
        window.location.hash = entry;
      }
    },

    routes: {
      '*url': 'resourceRoute'
    },

    resourceRoute: function(url) {
      url = location.hash.slice(1); // router removes preceding slash so get it manually
      this.browser.get(url);
    }
  });

  HAL.Models.Resource = Backbone.Model.extend({
    initialize: function(representation) {
      if(representation._links !== undefined) {
        this.links = representation._links;
      }
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
            arr.push(newResource);
          });
          result[rel] = arr;
        } else {
          var newResource = new HAL.Models.Resource(obj);
          newResource.identifier = rel;
          result[rel] = newResource;
        }
      });
      return result;
    }
  });

  HAL.Views.Browser = Backbone.View.extend({
    initialize: function() {
      var self = this;
      this.locationBar = new HAL.Views.LocationBar({ el: this.$('#location-bar') });
      this.resourceView = new HAL.Views.Resource({ el: this.$('#current-resource') });
      this.resourceView.bind('show-docs', function(e) { self.trigger('show-docs', e); });
    },

    get: function(url) {
      var self = this;
      this.locationBar.setLocation(url);
      var jqxhr = $.getJSON(url, function(resource) {
        self.resourceView.render(new HAL.Models.Resource(resource));
        self.trigger('render-resource', { resource: resource });
      }).error(function() {
        self.resourceView.showFailedRequest(jqxhr);
        self.trigger('render-resource', { resource: null });
      });
    }
  });

  HAL.Views.Resource = Backbone.View.extend({
    initialize: function(opts) {
      _.bindAll(this, 'followLink');
      _.bindAll(this, 'showCreateNonGetRequestDialog');
      _.bindAll(this, 'showUriQueryDialog');
      _.bindAll(this, 'showDocs');
    },

    events: {
      'click .links a.follow': 'followLink',
      'click .links a.non-get': 'showCreateNonGetRequestDialog',
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

    showFailedRequest: function(jqxhr) {
      this.$el.html(this.failedRequestTemplate({ jqxhr: jqxhr }));
    },

    followLink: function(e) {
      e.preventDefault();
      window.location.hash = $(e.target).attr('href');
    },

    showCreateNonGetRequestDialog: function(e) {
      e.preventDefault();
      alert('non-get requests coming soon.');
    },

    showUriQueryDialog: function(e) {
      e.preventDefault();

      var d = new HAL.Views.QueryUriDialog({
        href: $(e.target).attr('href')
      }).render();

      d.$el.dialog({
        title: 'Query URI Template',
        width: 400
      });
    },

    showDocs: function(e) {
      e.preventDefault();
      this.trigger('show-docs', { url: $(e.target).attr('href') });
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
              name: resource.identifier
            });
          });
        } else {
          result += self.embeddedResourceTemplate({
            state: obj.toJSON(),
            links: obj.links,
            name: obj.identifier
          });
        }
      });
      return result;
    },

    template: _.template($('#resource-template').html()),

    failedRequestTemplate: _.template($('#failed-request-template').html()),

    embeddedResourceTemplate: _.template($('#embedded-resource-template').html())
  });

  HAL.Views.LocationBar = Backbone.View.extend({
    setLocation: function(url) {
      this.address.html(url);
    },

    address: $('.address')
  });

  HAL.Views.Inspector = Backbone.View.extend({
    showDocs: function(e) {
      this.$('.panel').html('<iframe src=' + e.url + '></iframe>');
    },

    showRawResource: function(e) {
      this.$('.panel').html('<pre>' + JSON.stringify(e.resource, null, 2) + '</pre>');
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

  HAL.isUrl = function(str) {
    var urlRegex = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return str.match(urlRegex);
  };

  HAL.truncateIfUrl = function(str) {
    var replaceRegex = /(http|https):\/\/([^\/]*)\//;
    return str.replace(replaceRegex, '.../');
  };

  // make HAL object global
  window.HAL = HAL;
})();
