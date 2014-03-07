SW.methods.printStorageItems = function() {
  chrome.storage.local.get(null, function(o) {
    console.log(o);
  })
};

SW.methods.saveObject = function(object, callback, objectKey) {
  var storageObject = {};

  // By default questionId is used for creating objectKey
  if (!objectKey) {
    objectKey = object.objectType + ':' + object.questionId;
  }

  // Will be used at the time of deleting/updating this object
  object['objectKey'] = objectKey;

  storageObject[objectKey] = object;

  callback = callback || function() {};
  chrome.storage.local.set(storageObject, callback);
};

SW.methods.deleteObject = function(objectKey, callback) {
  callback = callback || function() {};
  chrome.storage.local.remove(objectKey, callback);
};

SW.methods.addObjectToStore = function(object) {
  if (object == null) return;

  var store = SW.maps.ObjectTypeToStoreMap[object.objectType];
  store && store.push(object);
};

SW.methods.removeObjectFromStore = function(objectKey, storeItems) {
  var isObjectRemoved = false;

  for (var i = storeItems.length - 1; i >= 0; i--) {
    if (typeof storeItems[i] == 'object' && storeItems[i]['objectKey'] == objectKey) {
      storeItems.splice(i, 1);
      isObjectRemoved = true;
    }
  }

  return isObjectRemoved;
};

SW.methods.updateStorageArea = function(store) {
  store = store || [];
  store.forEach(function(object) {
    SW.methods.saveObject(object, null, object['objectKey']);
  });
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

    $(document).trigger('stores:created');
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
 * @param url "http://math.stackexchange.com/questions/521071/combinatorics";
 * url.split('/'); -> ["http:", "", "math.stackexchange.com", "questions", "521071", "combinatorics"]
**/
SW.methods.extractQuestionPageUrlInfo = function(url) {
  var urlData = url.split('/');
  return {
    domain: urlData[2],
    questionId: urlData[4]
  };
};

/** Example
 * @param url (http://stackoverflow.com/users/1231561/user1231561)
 * url.split('/') -> ["http:", "", "stackoverflow.com", "users", "1231561", "user1231561"]
 */
SW.methods.extractProfilePageUrlInfo = function(url) {
  var urlData = url.split('/');

  return {
    domain: urlData[2],
    userId: urlData[4]
  };
};

SW.methods.validateUrl = function(url) {
  var isUrlValid = false;

  $.each(SW.vars.ALLOWED_PAGES, function(index, allowedUrl) {
    if (url.indexOf(allowedUrl) > -1) {
      isUrlValid = true;
    }
  });

  return isUrlValid;
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
  var message = { messageType: 'watchStatus', watchStatus: isPageWatched };
  
  SW.methods.sendMessageToContentScript(message, {
    url: url /*Send message to all tabs with this URL */
  });
};

SW.methods.sendFollowStatus = function(isUserFollowed, url) {
  var message = { messageType: 'followStatus', followStatus: isUserFollowed };
  SW.methods.sendMessageToContentScript(message, { url: url } );
};

SW.methods.contentScriptCommunicator = function(request, sender, sendResponse) {
  if (request.event == 'pageLoaded' && request.pageType == 'questionPage') {
    SW.methods.clearNotification(request.url);
    SW.methods.isPageBeingWatched(request.url, SW.methods.sendWatchStatus /* callback */);
  }

  if (request.event == 'pageLoaded' && request.pageType == 'profilePage') {
    SW.methods.isUserFollowed(request.url, SW.methods.sendFollowStatus);
  }

  if (request.action == 'watchPage') {
    SW.methods.startWatchingQuestion(request.url, function() {
      SW.methods.sendWatchStatus(true, request.url);
    });
  }

  if (request.action == 'unwatchPage') {
    SW.methods.unwatchQuestion(request.url, SW.methods.sendWatchStatus);
  }

  if (request.action == 'followUser') {
    SW.methods.followUser(request.url, function() {
      SW.methods.sendFollowStatus(true, request.url);
    });
  }

  if (request.action == 'unfollowUser') {
    SW.methods.unfollowUser(request.url, function() {
      SW.methods.sendFollowStatus(false, request.url);
    });
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
  setInterval(SW.methods.fetchUserNotifications, SW.vars.USER_NOTIFICATION_FETCH_INTERVAL);
};

SW.methods.init();