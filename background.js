var SW = SW || {};
SW.methods = SW.methods || {};
SW.vars = SW.vars || {};

/*-----------------------------------------------------------*/
SW.vars.isUrlValid = false;
SW.vars.activeTabUrl = '';

SW.vars.ALLOWED_PAGES = [
  'stackoverflow.com/questions/',
  'stackexchange.com/questions/'
];

SW.methods.startWatchingActiveTabPage = function() {
  // Check if active tab url belongs to allowed pages
  SW.vars.isUrlValid = false;

  chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
    // Since only one tab should be active and in the current window at once
    // the return variable should only have one entry
    var activeTab = arrayOfTabs[0];

    if (activeTab) {
      SW.vars.activeTabUrl = activeTab.url;
      SW.vars.isUrlValid = SW.methods.isCurrentTabUrlAllowed(SW.vars.activeTabUrl);

      if (SW.vars.isUrlValid) {
        SW.methods.initWatchingProcess();
      }
    } else {
      console.error('Unable to get the url of current tab.Please file a bug');
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

SW.methods.initWatchingProcess = function() {
  var urlInfo = SW.methods.extractUrlInfo(SW.vars.activeTabUrl);
  SW.vars = $.extend(SW.vars, urlInfo);

  alert(urlInfo.domain + '' + urlInfo.questionId);
}

/** Example
var url = "http://math.stackexchange.com/questions/521071/combinatorics-dividing-into-smaller-groups";
url.split('/');
["http:", "", "math.stackexchange.com", "questions", "521071",
 "combinatorics-dividing-into-smaller-groups"]
**/
SW.methods.extractUrlInfo = function(url) {
  var urlData = url.split('/');
  return {
    domain: urlData[2],
    questionId: urlData[4]
  };
}