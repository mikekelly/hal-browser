HAL.Views.Properties = Backbone.View.extend({
  initialize: function(opts) {
    this.vent = opts.vent;
    _.bindAll(this, 'render');
  },

  className: 'properties',
  
  _mkIndent: function(indent, space) {
    var s = "";
    for(var i=0; i<indent; ++i) {
      s += space;
    }
    return s;
  },
  
  _mkSpace : function(spaceChar, cols) {
    var s = "";
    for(i=0; i<cols; ++i) {
      s += spaceChar;
    }
    return s;
  },
  
  _isHalLink: function(key, value, stack) {
    if(!(key === "href") || !(typeof value === "string")) {
      return false;
    }
    
    var n = 3;
    if(stack.length < n) {
      return false;
    }
    
    var linkParent = stack[stack.length-n];
    
    if(Array.isArray(linkParent)) {
      if(stack.length < n+1) {
        return false;
      }
      ++n;
      linkParent = stack[stack.length-n];
    }
    
    if(stack.length < n+1) {
      return false;
    }
    ++n;
    var linkParentParent = stack[stack.length-n];
    
    return linkParentParent["_links"] === linkParent;
  },
  
  _stringifyImpl: function(key, value, indent, stack) {
    var s = "";
    var space = this._mkSpace(' ', HAL.jsonIndent);
    stack.push(value);
    if(key !== null) {
      s += '"' + key + '": ';
    }
    
    var link = this._isHalLink(key, value, stack);
    if(link) {
      s += "<a href='#" + value + "'>";
    }
    
    if(Array.isArray(value)) {
      s += '[';
      ++indent;
      for(var i=0; i<value.length; ++i) {
        s += this._stringifyImpl(null, value[i], indent, stack);
        if(i+1<value.length) {
          s += ", ";
        }
      }
      --indent;
      s += ']';
    } else if(typeof value === "object" && value !== null) {
      // typeof null is resolved as a object, but Object.keys(null) will raise exception
      s += '{\n';
      ++indent;
      var keys = Object.keys(value);
      for(var i=0; i<keys.length; ++i) {
        var k = keys[i];
        s += this._mkIndent(indent, space);
        s += this._stringifyImpl(k, value[k], indent, stack);
        if(i+1<keys.length) {
          s += ",";
        }
        s += "\n";
      }
      --indent;
      s += this._mkIndent(indent, space) + '}';
    } else if(typeof value === "boolean" ||
              typeof value === "number" ||
              typeof value === "string" ||
              (typeof value === "object" && value === null)) {
      s += _.escape(JSON.stringify(value, null, space));
    } 
    if(link) {
      s += "</a>";
    }
    stack.pop();
    return s;
  },
  
  render: function(props) {
    var propsHtml = this._stringifyImpl(null, props, 0, []);
    this.$el.html(this.template({ properties: propsHtml }));
  },

  template: _.template($('#properties-template').html())
});
