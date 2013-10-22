var SW = SW || {};
SW.methods = SW.methods || {};
SW.vars = SW.vars || {};
SW.stores = SW.stores || {};

/*-----------------------------------------------------------*/
SW.vars.isUrlValid = false;
SW.vars.activeTabUrl = '';

SW.vars.ALLOWED_PAGES = [
  'stackoverflow.com/questions/',
  'stackexchange.com/questions/'
];

SW.vars.TIME = {
  T_15_MIN: 60*15,
  T_30_MIN: 60*30,
  T_1_HOUR: 60*60,
  T_2_HOUR: 60*60*2,
  T_5_HOUR: 60*60*5,
  T_1_DAY:  60*60*24,
  T_2_DAY:  60*60*24*2,
  T_5_DAY:  60*60*24*5
};

SW.messages = {
  WARN_INVALID_URL: 'Please navigate to a stackoverflow question page',

  ERROR_UNABLE_TO_GET_URL_CURRENT_TAB: 'Unable to get the url of current tab.Please file a bug',
  ERROR_FETCH_ANSWER_LIST: 'Error in fetching answer list',
  ERROR_FETCH_COMMENT_LIST: 'Error in fetching comment list',

  INFO_DATA_SAVED: 'Data has been saved',
};

SW.methods.saveNotificationStore = function() {
  chrome.storage.sync.set({'notificationStore': SW.stores.notificationStore}, function() {
    console.log(SW.messages.INFO_DATA_SAVED);
  });
};

SW.methods.loadNotificationStore = function() {
  SW.stores.notificationStore = [];

  chrome.storage.sync.get('notificationStore', function(notificationsObject) {
    var notifications = notificationsObject.notifications; 

    if (notifications && !notifications.length) {
      SW.stores.notificationStore = notifications;
    }
  });
};

SW.methods.saveQuestionsFeedStore = function() {
  chrome.storage.sync.set({'questionFeedStore': SW.stores.questionFeedStore}, function() {
    console.log(SW.messages.INFO_DATA_SAVED);
  });
};

SW.methods.loadQuestionFeedStore = function() {
  SW.stores.questionFeedStore = [];

  chrome.storage.sync.get('questionFeedStore', function(questionFeed) {
    var questions = questionFeed.questions; 

    if (questions && !questions.length) {
      SW.stores.questionFeedStore = questions;
    }
  });
};

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
        alert(SW.messages.WARN_INVALID_URL);
      }
    } else {
      console.error(SW.messages.ERROR_UNABLE_TO_GET_URL_CURRENT_TAB);
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
  var urlInfo,
      questionName,
      questionData;

  urlInfo = SW.methods.extractUrlInfo(SW.vars.activeTabUrl);
  SW.vars = $.extend(SW.vars, urlInfo);

  questionData = SW.methods.getQuestionData(SW.vars.questionId, SW.vars.domain);
  SW.methods.addQuestionToStore(questionData);

  // Call the callback which changes the button in popover
};

/** TODO: @sacjain Will be used later on
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
**/

SW.methods.getUrlForQuestionData = function(questionId, domain) {
  // https://api.stackexchange.com/questions/18829971?site=stackoverflow
  return 'https://api.stackexchange.com/questions/' + questionId + '?site=' + domain;
};

SW.methods.getQuestionData = function(questionId, domain) {
  var url = SW.methods.getUrlForQuestionData(questionId, domain),
      questionData = {};

  questionData['domain'] = domain;
  questionData['question_id'] = questionId;

  $.ajax({
    method: 'GET',
    url: url,
    async: false,
    success: function(response) {
      var qInfo = response.items[0];

      questionData['last_edit_date'] = qInfo.last_edit_date;
      questionData['creation_date'] = qInfo.creation_date;
      questionData['title'] = qInfo.title;
      questionData['link'] = qInfo.link;
      questionData['owner'] = {};
      questionData['owner']['display_name'] = qInfo.owner.display_name;
      questionData['owner']['link'] = qInfo.owner.link;
    },
    error: function(e) {
      console.error(SW.messages.ERROR_FETCH_QUESTION_DATA);
      questionData = null;
    }
  });

  return questionData;
};

SW.methods.addQuestionToStore = function(questionData) {
  var currentTime = new Date().getTime();
  currentTime = parseInt(currentTime/1000);

  questionData['lastFetchDate'] = currentTime;
  questionData['nextFetchDate'] = SW.methods.getNextFetchDate(questionData.lastFetchDate, questionData.creation_date);

  SW.stores.questionFeedStore.push(questionData);
  SW.stores.questionFeedStore.sort(function(a,b) {
    return a.nextFetchDate - b.nextFetchDate;
  });

  SW.methods.saveQuestionsFeedStore();
}

SW.methods.getNextFetchDate = function(lastFetchDate, creation_date) {
  var difference = lastFetchDate - creation_date,
      nextFetchInterval = SW.vars.TIME.T_30_MIN;

  if (difference >= SW.vars.TIME.T_5_DAY) {
    nextFetchInterval = SW.vars.TIME.T_5_HOUR;
  } else if (difference >= SW.vars.TIME.T_2_DAY) {
    nextFetchInterval = SW.vars.TIME.T_2_HOUR;
  } else if (difference >= SW.vars.TIME.T_1_DAY) {
    nextFetchInterval = SW.vars.TIME.T_1_HOUR;
  } else {
    nextFetchInterval = SW.vars.TIME.T_30_MIN;
  }

  return lastFetchDate + nextFetchInterval;
};

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
      console.error(SW.messages.ERROR_FETCH_ANSWER_LIST);
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
      console.error(SW.messages.ERROR_FETCH_COMMENT_LIST);
    }
  });

  return commentList;
}

SW.methods.init = function() {
  SW.methods.loadNotificationStore();
  SW.methods.loadQuestionFeedStore();
}

SW.methods.init();