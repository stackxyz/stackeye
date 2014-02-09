SW.methods.saveObject = function(object, callback) {
  var objectKey = object.objectType + ':' + object.questionId,
    storageObject = {};

  storageObject[objectKey] = object;
  callback = callback || function() {};

  chrome.storage.local.set(storageObject, callback);
};

SW.methods.deleteObject = function(objectKey, callback) {
  callback = callback || function() {};
  chrome.storage.local.remove(objectKey, callback);
};

SW.methods.addObjectToStore = function(object) {
  var store = SW.maps.ObjectTypeToStoreMap[object.objectType];
  store && store.push(object);
};

/* @deprecated
* Used for version <= 1.3
* Use createStores > 1.3
* TODO: Remove notificationStore and questionFeedStore from localStorage later in 1.4/1.5
* */
SW.methods.loadNotificationStore = function() {
  chrome.storage.local.get('notificationStore', function(items) {
    var notifications = items.notificationStore || [];

    notifications.forEach(function(notification) {
      notification.objectType = SW.OBJECT_TYPES.NEW_ACTIVITY_NOTIFICATION;
      SW.methods.saveObject(notification, function() {
        SW.methods.addObjectToStore(notification);
        SW.methods.updateBadgeText();
      });
    });
  });
};

SW.methods.loadQuestionFeedStore = function() {
  chrome.storage.local.get('questionFeedStore', function(items) {
    var questions = items.questionFeedStore || [];

    questions.forEach(function(question) {
      question.objectType = SW.OBJECT_TYPES.QUESTION;
      SW.methods.saveObject(question, function() {
        SW.methods.addObjectToStore(question);
      });
    });
  });
};

// Will be used after data is migrated
SW.methods.createStores = function() {
  chrome.storage.local.get(null, function(superObject) {
    for (var key in superObject) {
      SW.methods.addObjectToStore(superObject[key]);
      SW.methods.updateBadgeText();
    }
  });
};

/* This method is being called whenever page is loaded
** So we extract all the page info here
*/
SW.methods.isPageBeingWatched = function(questionPageUrl, watchSuccessCallback) {
  var urlInfo = SW.methods.extractUrlInfo(questionPageUrl),
    isUrlValid,
    watchStatus = false;

  isUrlValid = SW.methods.validateQuestionUrl(questionPageUrl);
  if (isUrlValid) {
    watchStatus = SW.methods.isQuestionInStore(urlInfo.questionId, urlInfo.domain);
    watchSuccessCallback(watchStatus, questionPageUrl);
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
      break;
    }
  }

  return IS_QUESTION_REMOVED;
};

SW.methods.removeBulkQuestions = function(urls) {
  $.each(urls, function(index, url) {
    var urlInfo = SW.methods.extractUrlInfo(url);
    SW.methods.removeQuestionFromStore(urlInfo.questionId, urlInfo.domain);
    SW.methods.deleteObject(SW.OBJECT_TYPES.QUESTION + ':' + urlInfo.questionId);
  });
};

SW.methods.isQuestionWatchAllowed = function(questionUrl) {
  var questionStore = SW.stores.questionFeedStore,
    isUrlValid = SW.methods.validateQuestionUrl(questionUrl);

  if (questionStore.length >= SW.vars.WATCH_QUESTION_LIMIT) {
    return { allowed: false, reason: SW.messages.WARN_WATCH_LIMIT };
  }

  if (!isUrlValid) {
    return { allowed: false, reason: SW.messages.WARN_INVALID_URL };
  }

  return { allowed: true };
};

SW.methods.startWatchingQuestion = function(questionUrl, sCallback) {
  var QUESTION_WATCH_CRITERIA = SW.methods.isQuestionWatchAllowed(questionUrl),
    questionData,
    urlInfo;

  if (!QUESTION_WATCH_CRITERIA.allowed) {
    SW.methods.sendMessageToContentScript({
      messageType: 'notification',
      type: 'se_error',
      message: QUESTION_WATCH_CRITERIA.reason
    });
    return;
  }

  urlInfo = SW.methods.extractUrlInfo(questionUrl);
  questionData = SW.methods.getQuestionData(urlInfo.questionId, urlInfo.domain);
  SW.methods.addQuestionToStore(questionData, sCallback);
};

SW.methods.unwatchQuestion = function(questionUrl, sCallback) {
  var isQuestionRemoved = false,
    urlInfo = SW.methods.extractUrlInfo(questionUrl),
    isUrlValid = SW.methods.validateQuestionUrl(questionUrl),
    objectKey;

  if (isUrlValid) {
    isQuestionRemoved = SW.methods.removeQuestionFromStore(urlInfo.questionId, urlInfo.domain);
    objectKey = SW.OBJECT_TYPES.QUESTION + ':' + urlInfo.questionId;
    isQuestionRemoved && SW.methods.deleteObject(objectKey,
      function() { sCallback(false /* watchStatus */);
    });
  } else {
    console.error(SW.messages.WARN_INVALID_URL);
  }
};

SW.methods.validateQuestionUrl = function(url) {
  var isUrlValid = false;

  $.each(SW.vars.ALLOWED_PAGES, function(index, allowedUrl) {
    if (url.indexOf(allowedUrl) > -1) {
      isUrlValid = true;
    }
  });

  return isUrlValid;
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

SW.methods.addQuestionToStore = function(question, sCallback) {
  var currentTime = new Date().getTime();
  currentTime = parseInt(currentTime/1000);

  question['lastFetchDate'] = currentTime;
  question['nextFetchDate'] = SW.methods.getNextFetchDate(question.lastFetchDate, question.creation_date);
  question['objectType'] = SW.OBJECT_TYPES.QUESTION;

  SW.methods.saveObject(question, function() {
    SW.stores.questionFeedStore.push(question);
    SW.stores.questionFeedStore.sort(function(a,b) {
      return a.nextFetchDate - b.nextFetchDate;
    });
    sCallback();
  });
};

SW.methods.getNextFetchDate = function(lastFetchDate, creation_date) {
  var difference = lastFetchDate - creation_date,
    nextFetchInterval = SW.vars.TIME.T_30_MIN;

  if (difference >= SW.vars.TIME.T_5_DAY) {
    nextFetchInterval = SW.vars.TIME.T_10_HOUR;
  } else if (difference >= SW.vars.TIME.T_2_DAY) {
    nextFetchInterval = SW.vars.TIME.T_6_HOUR;
  } else if (difference >= SW.vars.TIME.T_1_DAY) {
    nextFetchInterval = SW.vars.TIME.T_2_HOUR;
  } else if (difference >= SW.vars.TIME.T_5_HOUR) {
    nextFetchInterval = SW.vars.TIME.T_30_MIN;
  } else if (difference >= SW.vars.TIME.T_2_HOUR) {
    nextFetchInterval = SW.vars.TIME.T_10_MIN;
  } else if (difference >= SW.vars.TIME.T_30_MIN) {
    nextFetchInterval = SW.vars.TIME.T_10_MIN;
  } else {
    nextFetchInterval = SW.vars.TIME.T_5_MIN;
  }

  // If app is in debug mode, we always want to fetch notification after 5 minutes
  if (SW.modes.inDebugMode) {
    nextFetchInterval = SW.vars.TIME.T_5_MIN;
  }

  return lastFetchDate + nextFetchInterval;
};

/** Example
var url = "http://math.stackexchange.com/questions/521071/combinatorics-dividing-into-smaller-groups";
url.split('/');
["http:", "", "math.stackexchange.com", "questions", "521071", "combinatorics-dividing-into-smaller-groups"]
**/
SW.methods.extractUrlInfo = function(url) {
  var urlData = url.split('/');
  return {
    domain: urlData[2],
    questionId: urlData[4]
  };
};

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
    existingNotificationEntry = null,
    newNotificationEntry = {},
    acceptedTimelineTypes = [
      SW.constants.NEW_COMMENT,
      SW.constants.ANSWER
    ];

  for (var i = updatesLength - 1; i >= 0; i--) {
    update = updates[i];

    // We only show notifications for new answers and new comments
    if (acceptedTimelineTypes.indexOf(update.timeline_type) >= 0) {
      // If notification store already contains an entry for same question just update it
      existingNotificationEntry = SW.methods.getNotificationEntryForQuestion(questionInfo);

      if (existingNotificationEntry) {
        // Update previous entry instead of creating new one
        if (update.timeline_type == SW.constants.NEW_COMMENT) {
          existingNotificationEntry.numComments++;
        }

        if (update.timeline_type == SW.constants.ANSWER) {
          existingNotificationEntry.numAnswers++;
        }

        // We want to have latest date on notification entry
        // So that we can have newest notification on top
        if (update.creation_date > existingNotificationEntry.creation_date) {
          existingNotificationEntry.creation_date = update.creation_date;
        }

        SW.methods.saveObject(existingNotificationEntry);
      } else {
        // Create a new notification entry
        newNotificationEntry.link = questionInfo.link;
        newNotificationEntry.title = questionInfo.title;
        newNotificationEntry.domain = questionInfo.domain;
        newNotificationEntry.objectType = SW.OBJECT_TYPES.NEW_ACTIVITY_NOTIFICATION;
        newNotificationEntry.questionId = questionInfo.questionId;
        newNotificationEntry.numComments = (update.timeline_type == SW.constants.NEW_COMMENT) ? 1 : 0;
        newNotificationEntry.numAnswers = (update.timeline_type == SW.constants.ANSWER) ? 1 : 0;

        // Push new entry into notification list
        SW.methods.saveObject(newNotificationEntry, function() {
          SW.stores.notificationStore.push(newNotificationEntry);
        });
      }
    }
  }
};

SW.methods.fetchNewNotifications = function() {
  var currentTime = parseInt(Date.now()/1000),
    questionFeedStoreLength = SW.stores.questionFeedStore.length,
    question,
    questionUpdates,
    isQuestionUpdated = false;

  for (var i = 0; i < questionFeedStoreLength; i++) {
    question = SW.stores.questionFeedStore[i];

    if (currentTime >= question.nextFetchDate) {
      questionUpdates = SW.methods.getQuestionUpdates(
                    question.questionId, question.domain, question.lastFetchDate);

      SW.modes.inDebugMode && console.log(question.title, questionUpdates);

      if (questionUpdates.length > 0) {
        // Parse the question updates and store relevant info into Notification Store
        SW.methods.updateNotificationStore(questionUpdates, question);
        isQuestionUpdated = true;
      }

      question.lastFetchDate = currentTime;
      question.nextFetchDate = SW.methods.getNextFetchDate(
                    question.lastFetchDate, question.creation_date);

      SW.methods.saveObject(question, function() {
        SW.stores.questionFeedStore.sort(function(a,b) {
          return a.nextFetchDate - b.nextFetchDate;
        });
      });

      // Since we have fetched notifications for a question,
      // we will fetch notification for next question after 5mins
      // to prevent throtlling of StackExchange API (so break here)
      break;
    }
  }
};

SW.methods.updateBadgeText = function(changes, areaName) {
  var numNotifications = SW.stores.notificationStore.length;

  if (numNotifications == 0) {
    numNotifications = '';
  } else if (numNotifications > 99) {
    numNotifications = '99+';
  } else {
    numNotifications = '' + numNotifications;
  }

  chrome.browserAction.setBadgeText({ text: numNotifications });
  chrome.browserAction.setBadgeBackgroundColor({ color: '#333' });
};

SW.methods.removeNotificationFromStore = function(questionId, domain) {
  var notificationStore = SW.stores.notificationStore,
    numNotifications = notificationStore.length,
    IS_NOTIFICATION_REMOVED = false;

  for (var i = numNotifications - 1; i >= 0; i--) {
    if (notificationStore[i].questionId === questionId && notificationStore[i].domain == domain) {
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
    IS_NOTIFICATION_REMOVED,
    objectKey;

  if (SW.methods.validateQuestionUrl(url)) {
    urlInfo = SW.methods.extractUrlInfo(url);

    IS_NOTIFICATION_REMOVED = SW.methods.removeNotificationFromStore(urlInfo.questionId, urlInfo.domain);
    if (IS_NOTIFICATION_REMOVED) {
      objectKey = SW.OBJECT_TYPES.NEW_ACTIVITY_NOTIFICATION + ':' + urlInfo.questionId;
      SW.methods.deleteObject(objectKey, SW.methods.updateBadgeText);
    }
  }
};

SW.methods.removeBulkNotifications = function(urls) {
  $.each(urls, function(index, url) {
    SW.methods.clearNotification(url);
  });
};

SW.methods.sendMessageToContentScript = function(message, options) {
  options = options || {};
  var hashPosition = (options.url ? options.url.indexOf('#') : -1);

  // Remove # if it is present in the URL
  if (hashPosition != -1) {
    options.url = options.url.substr(0, hashPosition);
  }

  chrome.tabs.query(options, function(tabs) {
    $.each(tabs, function(index, tab) {
      chrome.tabs.sendMessage(tab.id, message);
    });
  });
};

SW.methods.sendWatchStatus = function(isPageWatched, url) {
  var message = {
    messageType: 'watchStatus',
    watchStatus: isPageWatched
  };
  
  SW.methods.sendMessageToContentScript(message, {
    url: url /*Send message to all tabs with this URL */
  });
};

SW.methods.contentScriptCommunicator = function(request, sender, sendResponse) {
  if (request.event == 'pageLoaded') {
    SW.methods.clearNotification(request.url);
    SW.methods.isPageBeingWatched(request.url, SW.methods.sendWatchStatus /* callback */);
  }

  if (request.action == 'watchPage') {
    SW.methods.startWatchingQuestion(request.url, function() {
      SW.methods.sendWatchStatus(true, request.url);
    });
  }

  if (request.action == 'unwatchPage') {
    SW.methods.unwatchQuestion(request.url, SW.methods.sendWatchStatus);
  }
};

SW.methods.init = function() {
  // If data is migrated, then create stores from migrated data
  chrome.storage.local.get('isDataMigrated', function(o) {
    if (o.isDataMigrated) {
      SW.methods.createStores();
    } else {
      SW.methods.loadQuestionFeedStore();
      SW.methods.loadNotificationStore();
      chrome.storage.local.set({'isDataMigrated': true}, null);
    }
  });

  chrome.storage.onChanged.addListener(SW.methods.updateBadgeText);

  // Add Listener for events from content scripts
  chrome.runtime.onMessage.addListener(SW.methods.contentScriptCommunicator);

  setInterval(SW.methods.fetchNewNotifications, SW.vars.FETCH_NOTIFICATION_INTERVAL);
};

SW.methods.init();