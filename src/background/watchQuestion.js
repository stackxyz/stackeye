SW.methods.isQuestionInStore = function(questionId, domain) {
  for (var i=0; i < SW.stores.questionFeedStore.length; i++) {
    if (SW.stores.questionFeedStore[i].domain == domain &&
      SW.stores.questionFeedStore[i].questionId == questionId) {
      return true;
    }
  }
  return false;
};

/* This method is being called whenever question page is loaded */
SW.methods.isPageBeingWatched = function(questionPageUrl, watchSuccessCallback) {
  var urlInfo = SW.methods.extractQuestionPageUrlInfo(questionPageUrl),
    isUrlValid,
    watchStatus = false;

  isUrlValid = SW.methods.validateUrl(questionPageUrl);
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
    var urlInfo = SW.methods.extractQuestionPageUrlInfo(url);
    SW.methods.removeQuestionFromStore(urlInfo.questionId, urlInfo.domain);
    SW.methods.deleteObject(SW.OBJECT_TYPES.QUESTION + ':' + urlInfo.questionId);
  });
};

SW.methods.isQuestionWatchAllowed = function(questionUrl) {
  var questionStore = SW.stores.questionFeedStore,
    isUrlValid = SW.methods.validateUrl(questionUrl);

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

  urlInfo = SW.methods.extractQuestionPageUrlInfo(questionUrl);
  questionData = SW.methods.getQuestionData(urlInfo.questionId, urlInfo.domain);
  SW.methods.addQuestionToStore(questionData, sCallback);
};

SW.methods.unwatchQuestion = function(questionUrl, sCallback) {
  var isQuestionRemoved = false,
    urlInfo = SW.methods.extractQuestionPageUrlInfo(questionUrl),
    isUrlValid = SW.methods.validateUrl(questionUrl),
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

  if (SW.methods.validateUrl(url)) {
    urlInfo = SW.methods.extractQuestionPageUrlInfo(url);

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
        SW.stores.notificationStore.push(newNotificationEntry);
        SW.methods.saveObject(newNotificationEntry);
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