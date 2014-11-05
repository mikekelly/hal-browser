HAL.Views.Documenation = Backbone.View.extend({
  className: 'documentation',

  render: function(url) {
    this.$el.html('<pre id="docSection">Loading...</pre>');
    $.ajax({
      url: url,
      dataType: 'json',
      success: function(resource) {
        $('#docSection').text(JSON.stringify(resource, null, '  '));
      }
    }).error(function() {
      $('#docSection').text('Error: Unable to get documentation');
    });
  }
});
