var SW = SW || {};
SW.methods = SW.methods || {};
SW.vars = SW.vars || {};

/*-----------------------------------------------------------
-------------------------------------------------------------
-------------------------------------------------------------
*/

SW.vars.ALLOWED_PAGES = [
  'stackoverflow.com/questions/',
  'stackexchange.com/questions/'
];

SW.methods.startWatchingActiveTabPage = function() {
  // Check if active tab url belongs to allowed pages
  var activeTabUrl = '',
      isUrlValid = false;

  chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
    // Since only one tab should be active and in the current window at once
    // the return variable should only have one entry
    var activeTab = arrayOfTabs[0];

    if (activeTab) {
      activeTabUrl = activeTab.url;
      isUrlValid = SW.methods.isCurrentTabUrlAllowed(activeTabUrl);
      alert(isUrlValid);
    } else {
      console.error('Unable to get the url of current tab..Please file a bug');
    }
  });
}

SW.methods.isCurrentTabUrlAllowed = function(url) {
  var isUrlValid = false;
  $.each(SW.vars.ALLOWED_PAGES, function(index, allowedUrl) {
    if (url.indexOf(allowedUrl) > -1) {
      isUrlValid = true;
    }
  });

  return isUrlValid;
}