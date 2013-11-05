window.SW = window.SW || {};
SW.methods = SW.methods || {};
SW.vars = SW.vars || {};
SW.stores = SW.stores || {};
SW.callbacks = SW.callbacks || {};
SW.modes = SW.modes || {};
SW.constants = SW.constants || {};

/*-----------------------------------------------------------*/
SW.methods.getUrlForQuestionUpdates = function(id, domain, lastFetchDate) {
  // https://api.stackexchange.com/questions/19570820/timeline?fromdate=1382486400&site=stackoverflow
  return 'https://api.stackexchange.com/questions/' + id + '/timeline?fromdate=' + 
          lastFetchDate + '&site=' + domain;
}

SW.methods.getQuestionUpdates = function(id, domain, lastFetchDate) {
  var url = SW.methods.getUrlForQuestionUpdates(id, domain, lastFetchDate),
      questionUpdates = [];

  // url = '';

  $.ajax({
    method: 'GET',
    url: url,
    async: false,
    success: function(response) {
      questionUpdates = response.items;
    },
    error: function(e) {
      console.error(e);
    }
  });

  return questionUpdates;
}