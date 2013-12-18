SW.methods.saveNotificationStore = function() {
  chrome.storage.sync.set({'notificationStore': SW.stores.notificationStore}, function() {
    if (SW.modes.inDebugMode) {
      console.log(SW.messages.INFO_DATA_SAVED);
    }
  });
};

SW.methods.loadNotificationStore = function() {
  SW.stores.notificationStore = [];

  chrome.storage.sync.get('notificationStore', function(items) {
    var notifications = items.notificationStore;

    if (notifications && notifications.length) {
      SW.stores.notificationStore = notifications;
      SW.methods.updateBadgeText();
    }
  });
};

SW.methods.saveQuestionsFeedStore = function() {
  chrome.storage.sync.set({
    'questionFeedStore': SW.stores.questionFeedStore
  }, function() {
    if (SW.callbacks.watchProcessSuccessCallback) {
      SW.callbacks.watchProcessSuccessCallback(SW.messages.INFO_DATA_SAVED);
      SW.callbacks.watchProcessSuccessCallback = null;
    }
  });
};

SW.methods.loadQuestionFeedStore = function() {
  SW.stores.questionFeedStore = [];

  chrome.storage.sync.get('questionFeedStore', function(items) {
    var questions = items.questionFeedStore;

    if (questions && questions.length) {
      SW.stores.questionFeedStore = questions;
    }
  });
};

/* This method is being called whenever page is loaded
** So we extract all the page info here
*/
SW.methods.isPagebeingWatched = function(activeTabUrl, watchSuccessCallback) {
  var urlInfo,
    watchStatus = false;

  SW.vars.isUrlValid = false;
  SW.vars.activeTabUrl = activeTabUrl;
  SW.vars.isUrlValid = SW.methods.isCurrentTabUrlAllowed(SW.vars.activeTabUrl);

  urlInfo = SW.methods.extractUrlInfo(SW.vars.activeTabUrl);
  SW.vars = $.extend(SW.vars, urlInfo);

  if (SW.vars.isUrlValid) {
    watchStatus = SW.methods.isQuestionInStore(urlInfo.questionId, urlInfo.domain);
    watchSuccessCallback(watchStatus);
  }
};

SW.methods.removeQuestionFromStore = function(questionId, domain) {
  var questionList = SW.stores.questionFeedStore,
    question = null,
    index,
    IS_QUESTION_REMOVED = false;

  for (index = questionList.length - 1; index >= 0; index--) {
    question = questionList[index];

    if (question.domain == domain && question.questionId == questionId) {
      questionList.splice(index, 1);
      IS_QUESTION_REMOVED = true;
    }
  }

  return IS_QUESTION_REMOVED;
};

SW.methods.removeBulkQuestions = function(urls) {
  $.each(urls, function(index, url) {
    var urlInfo = SW.methods.extractUrlInfo(url);
    SW.methods.removeQuestionFromStore(urlInfo.questionId, urlInfo.domain);
  });

  SW.methods.saveQuestionsFeedStore();
};

SW.methods.isQuestionWatchAllowed = function() {
  var questionStore = SW.stores.questionFeedStore;

  if (questionStore.length >= SW.vars.WATCH_QUESTION_LIMIT) {
    return {allowed: false, reason: SW.messages.WARN_WATCH_LIMIT};
  }

  if (!SW.vars.isUrlValid) {
    return {allowed: false, reason: SW.messages.WARN_INVALID_URL};
  }

  return {allowed: true};
};

SW.methods.startWatchingActiveTabPage = function(watchProcessSuccessCallback) {
  var QUESTION_WATCH_CRITERIA;

  // Register the callback here
  SW.callbacks.watchProcessSuccessCallback = watchProcessSuccessCallback;
  QUESTION_WATCH_CRITERIA = SW.methods.isQuestionWatchAllowed();

  if (!QUESTION_WATCH_CRITERIA.allowed) {
    SW.methods.sendMessageToContentScript({
      messageType: 'notification',
      type: 'se_error',
      message: QUESTION_WATCH_CRITERIA.reason
    });
    return;
  }

  SW.methods.initWatchingProcess();
};

SW.methods.unwatchActiveTabPage = function(sCallback) {
  var isQuestionRemoved = false;

  if (SW.vars.isUrlValid) {
    isQuestionRemoved = SW.methods.removeQuestionFromStore(SW.vars.questionId, SW.vars.domain);
    if (isQuestionRemoved) {
      sCallback(false /* watchStatus */);
      SW.methods.saveQuestionsFeedStore();
    }
  } else {
    console.error(SW.messages.WARN_INVALID_URL);
  }
};

SW.methods.isCurrentTabUrlAllowed = function(url) {
  var isUrlValid = false;

  $.each(SW.vars.ALLOWED_PAGES, function(index, allowedUrl) {
    if (url.indexOf(allowedUrl) > -1) {
      isUrlValid = true;
    }
  });

  return isUrlValid;
};

SW.methods.initWatchingProcess = function() {
  var questionData;

  questionData = SW.methods.getQuestionData(SW.vars.questionId, SW.vars.domain);
  SW.methods.addQuestionToStore(questionData);
};

SW.methods.isQuestionInStore = function(questionId, domain) {
  for (var i=0; i < SW.stores.questionFeedStore.length; i++) {
    if (SW.stores.questionFeedStore[i].domain == domain &&
      SW.stores.questionFeedStore[i].questionId == questionId) {
      return true;
    }
  }
  return false;
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
};

SW.methods.getNextFetchDate = function(lastFetchDate, creation_date) {
  var difference = lastFetchDate - creation_date,
    nextFetchInterval = SW.vars.TIME.T_30_MIN;

  if (difference >= SW.vars.TIME.T_5_DAY) {
    nextFetchInterval = SW.vars.TIME.T_10_HOUR;
  } else if (difference >= SW.vars.TIME.T_2_DAY) {
    nextFetchInterval = SW.vars.TIME.T_5_HOUR;
  } else if (difference >= SW.vars.TIME.T_1_DAY) {
    nextFetchInterval = SW.vars.TIME.T_2_HOUR;
  } else {
    nextFetchInterval = SW.vars.TIME.T_5_MIN;
  }

  // If app is in debug mode, we always want to fetch notification after 2 minutes
  if (SW.modes.inDebugMode) {
    nextFetchInterval = SW.vars.TIME.T_5_MIN;
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

SW.methods.getNotificationEntryForQuestion = function(question) {
  var notifications = SW.stores.notificationStore;

  for (var i = notifications.length - 1; i>=0; i--) {
    if (question.link && notifications[i].link === question.link) {
      return notifications[i];
    }
  }

  return null;
};

SW.methods.updateNotificationStore = function(updates, questionInfo) {
  var updatesLength = updates.length,
    update = null,
    entryForSameQuestion = null,
    notificationEntry = {},
    acceptedTimelineTypes = [
      SW.constants.NEW_COMMENT,
      SW.constants.ANSWER
    ];

  for (var i = updatesLength - 1; i >= 0; i--) {
    update = updates[i];

    // We only show notifications for new answers and new comments
    if (acceptedTimelineTypes.indexOf(update.timeline_type) >= 0) {
      // If notification store already contains an entry for same question just update it
      entryForSameQuestion = SW.methods.getNotificationEntryForQuestion(questionInfo);

      if (entryForSameQuestion) {
        // Update previous entry instead of creating new one
        if (update.timeline_type == SW.constants.NEW_COMMENT) {
          entryForSameQuestion.numComments++;
        }

        if (update.timeline_type == SW.constants.ANSWER) {
          entryForSameQuestion.numAnswers++;
        }

        // We want to have latest date on notification entry
        // So that we can have newest notification on top
        if (update.creation_date > entryForSameQuestion.creation_date) {
          entryForSameQuestion.creation_date = update.creation_date;
        }
      } else {
        // Create a new notification entry
        notificationEntry.link = questionInfo.link;
        notificationEntry.title = questionInfo.title;
        notificationEntry.domain = questionInfo.domain;
        notificationEntry.questionId = questionInfo.questionId;
        notificationEntry.numComments = (update.timeline_type == SW.constants.NEW_COMMENT) ? 1 : 0;
        notificationEntry.numAnswers = (update.timeline_type == SW.constants.ANSWER) ? 1 : 0;

        // Push new entry into notification list
        SW.stores.notificationStore.push(notificationEntry);
      }
    }
  }
};

SW.methods.fetchNewNotifications = function() {
  var currentTime = parseInt(Date.now()/1000),
    i,
    questionFeedStoreLength = SW.stores.questionFeedStore.length,
    question,
    questionUpdates,
    isQuestionUpdated = false;

  for (i = 0; i < questionFeedStoreLength; i++) {
    question = SW.stores.questionFeedStore[i];

    if (currentTime >= question.nextFetchDate) {
      questionUpdates = SW.methods.getQuestionUpdates(
                    question.questionId, question.domain, question.lastFetchDate);

      if (SW.modes.inDebugMode) {
        console.log(question.title);
        console.log(questionUpdates);
      }

      if (questionUpdates.length > 0) {
        // Parse the question updates and store relevant info into Notification Store
        SW.methods.updateNotificationStore(questionUpdates, question);
        isQuestionUpdated = true;
      }

      question.lastFetchDate = currentTime;
      question.nextFetchDate = SW.methods.getNextFetchDate(
                    question.lastFetchDate, question.creation_date);

      // Since we have fetched notifications for a question,
      // we will fetch notification for next question after 5mins
      // to prevent throtlling of StackExchange API (so break here)
      break;
    } else {
      //Since questionFeedStore is sorted by nextFetchDate So we can safely exit the loop
      // when we encounter a question having nextFecthDate greater than currentTime
      break;
    }
  }

  SW.stores.questionFeedStore.sort(function(a,b) {
    return a.nextFetchDate - b.nextFetchDate;
  });

  SW.methods.saveQuestionsFeedStore();

  // Save final updatedNotificationStore
  if (isQuestionUpdated) {
    SW.methods.saveNotificationStore();
  }
};

SW.methods.updateBadgeText = function(changes, areaName) {
  var numNotifications = SW.stores.notificationStore.length;

  if (numNotifications ==0 ) {
    numNotifications = '';
  } else if (numNotifications > 99) {
    numNotifications = '99+';
  } else {
    numNotifications = '' + numNotifications;
  }

  chrome.browserAction.setBadgeText({ text: numNotifications });
  chrome.browserAction.setBadgeBackgroundColor({ color: '#333' });
};

SW.methods.removeNotificationFromStore = function(qId, domain) {
  var notificationStore = SW.stores.notificationStore,
    numNotifications = notificationStore.length,
    IS_NOTIFICATION_REMOVED = false;

  for (var i = numNotifications - 1; i >= 0; i--) {
    if (notificationStore[i].questionId === qId && notificationStore[i].domain == domain) {
      if (SW.modes.inDebugMode) {
        console.log('Removing: ' + notificationStore[i].title + ' from Notification Store');
      }

      notificationStore.splice(i, 1);
      IS_NOTIFICATION_REMOVED = true;
    }
  }

  return IS_NOTIFICATION_REMOVED;
};

SW.methods.clearNotification = function(url) {
  var urlInfo,
    IS_NOTIFICATION_REMOVED;

  if (SW.methods.isCurrentTabUrlAllowed(url)) {
    urlInfo = SW.methods.extractUrlInfo(url);

    IS_NOTIFICATION_REMOVED = SW.methods.removeNotificationFromStore(urlInfo.questionId, urlInfo.domain);
    if (IS_NOTIFICATION_REMOVED) {
      SW.methods.saveNotificationStore();

      // Badge is not getting updated automatically whenever store is changed behind the scene
      // So explicitly setting the badge value
      SW.methods.updateBadgeText();
    }
  }
};

SW.methods.clearBulkNotifications = function(urls) {
  $.each(urls, function(index, url) {
    console.log(url);
    var urlInfo = SW.methods.extractUrlInfo(url);
    SW.methods.removeNotificationFromStore(urlInfo.questionId, urlInfo.domain);
  });

  SW.methods.saveNotificationStore();
  SW.methods.updateBadgeText();
};

SW.methods.sendMessageToContentScript = function(message) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
};

SW.methods.sendWatchStatus = function(isPageWatched) {
  var message = {
    messageType: 'watchStatus',
    watchStatus: isPageWatched
  };
  
  SW.methods.sendMessageToContentScript(message);
};

SW.methods.contentScriptCommunicator = function(request, sender, sendResponse) {
  if (request.event == 'pageLoaded') {
    SW.methods.clearNotification(request.url);
    SW.methods.isPagebeingWatched(request.url, SW.methods.sendWatchStatus /* callback */);
  } else if (request.action == 'watchPage') {
    SW.methods.startWatchingActiveTabPage(SW.methods.sendWatchStatus);
  } else if (request.action == 'unwatchPage') {
    SW.methods.unwatchActiveTabPage(SW.methods.sendWatchStatus);
  }
};

SW.methods.init = function() {
  SW.methods.loadNotificationStore();
  SW.methods.loadQuestionFeedStore();

  chrome.storage.onChanged.addListener(SW.methods.updateBadgeText);

  // Add Listener for events from content scripts
  chrome.runtime.onMessage.addListener(SW.methods.contentScriptCommunicator);

  setInterval(SW.methods.fetchNewNotifications, SW.vars.FETCH_NOTIFICATION_INTERVAL);
};

SW.methods.init();