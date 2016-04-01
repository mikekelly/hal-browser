(function() {
  var urlRegex = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

  var HAL = {
    Models: {},
    Views: {},
    Http: {},
    currentDocument: {},
    jsonIndent: 2,
    isUrl: function(str) {
      return str.match(urlRegex) || HAL.isCurie(str);
    },
    isCurie: function(string) {
      var isCurie = false;
      var curieParts = string.split(':');
      var curies = HAL.currentDocument._links.curies;

      if(curieParts.length > 1 && curies) {

        for (var i=0; i<curies.length; i++) {
          if (curies[i].name == curieParts[0]) {
            isCurie = true;
            break;
          }
        }
      }
      return isCurie;
    },
    isFollowableHeader: function(headerName) {
      return headerName === 'Location' || headerName === 'Content-Location';
    },
    truncateIfUrl: function(str) {
      var replaceRegex = /(http|https):\/\/([^\/]*)\//;
        return str.replace(replaceRegex, '.../');
    },
    normalizeUrl: function(rel) {
       var cur = location.hash.slice(1);
       var uri = new URI(rel)
       var norm = uri.absoluteTo(cur);

       return norm
	},
    buildUrl: function(rel) {
      if (!HAL.currentDocument._links) {
        return rel;
      }
      if (!rel.match(urlRegex) && HAL.isCurie(rel) && HAL.currentDocument._links.curies) {
        var parts = rel.split(':');
        var curies = HAL.currentDocument._links.curies;
        for (var i=0; i<curies.length; i++) {
          if (curies[i].name == parts[0]) {
            var tmpl = uritemplate(curies[i].href);
            return tmpl.expand({ rel: parts[1] });
          }
        }
      }
      else if (!rel.match(urlRegex) && HAL.isCurie(rel) && HAL.currentDocument._links.curie) {
        // Backward compatibility with <04 version of spec.
        var tmpl = uritemplate(HAL.currentDocument._links.curie.href);
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
    customPostForm: undefined
  };

  window.HAL = HAL;
})();
