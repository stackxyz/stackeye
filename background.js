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
      } else {
        alert('Not a valid stackoverflow or stackexchange url');
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
  var answerList,
      answerIds,
      commentList,
      urlInfo;

  urlInfo = SW.methods.extractUrlInfo(SW.vars.activeTabUrl);
  SW.vars = $.extend(SW.vars, urlInfo);

  answerList = SW.methods.getAllAnswers(SW.vars.questionId, SW.vars.domain);
  answerIds = SW.methods.getAllAnswerIds(answerList);

  commentList = SW.methods.getAllComments(answerIds, SW.vars.domain);
  alert(JSON.stringify(commentList));

  // Save the questionInfo on the disk
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

SW.methods.getUrlForAllAnswers = function(questionId, domain) {
  return 'https://api.stackexchange.com/questions/' + questionId + '/answers?site=' + domain;
}

SW.methods.getAllAnswers = function(questionId, domain) {
  var url = SW.methods.getUrlForAllAnswers(questionId, domain);
  var answerList = null;

  $.ajax({
    method: 'GET',
    url: url,
    async: false,
    success: function(response) {
      answerList = response.items;
    },
    error: function(e) {
      console.error('Error in fetching asnwer list');
    }
  });

  return answerList;
}

SW.methods.getAllAnswerIds = function(answerList) {
  var answerIds = [];
  $.each(answerList, function(index, answerObject) {
    answerIds.push(answerObject.answer_id);
  });

  // Add question id to the list as well because want to fetch comments for the question too
  answerIds.push(SW.vars.questionId);
  return answerIds;
}

SW.methods.getUrlForAllComments = function(idString, domain) {
  // e.g. https://api.stackexchange.com/posts/18829971;18830520;18830230/comments?site=stackoverflow
  return 'https://api.stackexchange.com/posts/' + idString + '/comments?site=' + domain;
}

SW.methods.getAllComments = function(ids, domain) {
  var idString,
      url,
      commentList;

  idString = ids.join(';');
  url = SW.methods.getUrlForAllComments(idString, domain);

  $.ajax({
    method: 'GET',
    url: url,
    async: false,
    success: function(response) {
      commentList = response.items;
    },
    error: function(e) {
      console.error('Error in fetching asnwer list');
    }
  });

  return commentList;
}