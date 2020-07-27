SW.methods.printStorageItems = function() {
  chrome.storage.local.get(null, function(o) {
    console.log(o);
  })
};

/**
 * Saves object in chrome storage and returns a promise. Encapsulates error handling snad passes the error back to callee
 * Callee can call .then()/.catch() on this to perform post save operation
 * If saveObject is called from async method, callee can also call await on it
 * @param object
 * @param objectKey
 * @returns {Promise<any>}
 */
SW.methods.saveObject = function(object, objectKey=undefined) {
  // By default questionId is used for creating objectKey
  if (!objectKey) {
    objectKey = object.objectType + ':' + object.questionId;
  }

  // Will be used at the time of deleting/updating this object
  object['objectKey'] = objectKey;

  const storageObject = {
    [objectKey]: object
  };

  return new Promise((resolve, reject) => {
    chrome.storage.local.set(storageObject, (data) => {
      const err = chrome.runtime.lastError;
      if (err) {
        console.error(err);
        reject(err)
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Wrapper over chrome.storage.remove. Deletes object (or multiple objects) from storage and returns a promise
 * @param objectKey
 * @returns {Promise<any>}
 */
SW.methods.deleteObject = function(objectKey) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(objectKey, (data) => {
      const err = chrome.runtime.lastError;
      if (err) {
        console.error(err);
        reject(err)
      } else {
        resolve(data);
      }
    });
  });
};

SW.methods.addObjectToStore = function(object) {
  if (object == null) return;

  const store = SW.maps.ObjectTypeToStoreMap[object.objectType];
  store && store.push(object);
};

/**
 * @param objectKey {string}
 * @param storeItems {Array}
 */
SW.methods.removeObjectFromStore = function(objectKey, storeItems) {
  let isObjectRemoved = false;

  for (let i = storeItems.length - 1; i >= 0; i--) {
    if (typeof storeItems[i] === 'object' && storeItems[i]['objectKey'] === objectKey) {
      storeItems.splice(i, 1);
      isObjectRemoved = true;
    }
  }

  return isObjectRemoved;
};

SW.methods.updateStorageArea = function(store) {
  store = store || [];
  const promiseArr = [];
  store.forEach(object => {
    promiseArr.push(SW.methods.saveObject(object, object['objectKey']));
  });

  Promise.all(promiseArr).then(() => {
    console.log('Storage Area updates');
  });
};

SW.methods.createStores = function() {
  // Reset all stores
  SW.stores.questionFeedStore.length = 0;
  SW.stores.notificationStore.length = 0;
  SW.stores.userStore.length = 0;
  SW.stores.userNotificationStore.length = 0;

  chrome.storage.local.get(null, function(superObject) {
    for (let key in superObject) {
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
  // At the moment, we insert content scripts only on question pages
  // So we can assume url is valid
  return true;
};

SW.methods.updateBadgeText = function() {
  /** @type {string|number} */
  let numNotifications = SW.stores.notificationStore.length + SW.stores.userNotificationStore.length;

  if (numNotifications === 0) {
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
  if (hashPosition !== -1) {
    options.url = options.url.substr(0, hashPosition);
  }

  chrome.tabs.query(options, function(tabs) {
    $.each(tabs, function(index, tab) {
      chrome.tabs.sendMessage(tab.id, message);
    });
  });
};

/**
 * Sends WatchStatus to content script so that content script can update eye icon
 * @param watchStatus true, false or null. Null when page url is invalid
 * @param url Page URL to which watchStatus should be sent
 */
SW.methods.sendWatchStatus = function(watchStatus, url) {
  if (watchStatus == null) return;

  const message = { messageType: 'watchStatus', watchStatus: watchStatus };
  SW.methods.sendMessageToContentScript(message, {
    url: url /*Send message to all tabs with this URL */
  });
};

SW.methods.sendFollowStatus = function(followStatus, url) {
  if (followStatus == null) return;

  const message = { messageType: 'followStatus', followStatus: followStatus };
  SW.methods.sendMessageToContentScript(message, { url: url } );
};

SW.methods.contentScriptCommunicator = async function(request, sender, sendResponse) {
  if (request.event === 'pageLoaded' && request.pageType === 'questionPage') {
    let isNotificationRemoved = SW.methods.clearNotification(request.url);
    const watchStatus = SW.methods.isPageBeingWatched(request.url);
    SW.methods.sendWatchStatus(watchStatus, request.url);

    if (isNotificationRemoved) {
      AnalyticsHelper.trackEvent(
        SW.TRACKING_INFO.CATEGORIES.QUESTION_NOTIF,
        SW.TRACKING_INFO.ACTIONS.DELETED,
        'question notification removed by opening question page'
      )
    }
  }

  if (request.event === 'pageLoaded' && request.pageType === 'profilePage') {
    const followStatus = SW.methods.isUserFollowed(request.url);
    SW.methods.sendFollowStatus(followStatus, request.url);
    AnalyticsHelper.trackEvent(
      SW.TRACKING_INFO.CATEGORIES.USER, SW.TRACKING_INFO.ACTIONS.VIEWED
    );
  }

  if (request.action === 'watchPage') {
    await SW.methods.startWatchingQuestionAsync(request.url);
    const watchStatus = SW.methods.isPageBeingWatched(request.url);
    SW.methods.sendWatchStatus(watchStatus, request.url);

    watchStatus && AnalyticsHelper.trackEvent(
      SW.TRACKING_INFO.CATEGORIES.QUESTION, SW.TRACKING_INFO.ACTIONS.FOLLOWED
    );
  }

  if (request.action === 'unwatchPage') {
    await SW.methods.unwatchQuestionAsync(request.url);
    const watchStatus = SW.methods.isPageBeingWatched(request.url);
    SW.methods.sendWatchStatus(watchStatus, request.url);
    AnalyticsHelper.trackEvent(
      SW.TRACKING_INFO.CATEGORIES.QUESTION, SW.TRACKING_INFO.ACTIONS.UNFOLLOWED
    );
  }

  if (request.action === 'followUserAsync') {
    await SW.methods.followUserAsync(request.url);
    const followStatus = SW.methods.isUserFollowed(request.url);
    SW.methods.sendFollowStatus(followStatus, request.url);
    
    followStatus && AnalyticsHelper.trackEvent(
      SW.TRACKING_INFO.CATEGORIES.USER, SW.TRACKING_INFO.ACTIONS.FOLLOWED
    );
  }

  if (request.action === 'unfollowUserAsync') {
    await SW.methods.unfollowUserAsync(request.url);
    const followStatus = SW.methods.isUserFollowed(request.url);
    SW.methods.sendFollowStatus(followStatus, request.url);

    AnalyticsHelper.trackEvent(
      SW.TRACKING_INFO.CATEGORIES.USER, SW.TRACKING_INFO.ACTIONS.UNFOLLOWED
    );
  }
};

SW.methods.submitEvent = function() {
  chrome.runtime.onInstalled.addListener((details) => {
    const currentVersion = chrome.runtime.getManifest().version
    const previousVersion = details.previousVersion
    const reason = details.reason
 
    switch (reason) {
      case 'install':
        AnalyticsHelper.trackEvent(
          SW.TRACKING_INFO.CATEGORIES.EXTENSION,
          SW.TRACKING_INFO.ACTIONS.INSTALLED,
          `${currentVersion} extension installed`
        )
        break;
       
        case 'update':
          AnalyticsHelper.trackEvent(
            SW.TRACKING_INFO.CATEGORIES.EXTENSION,
            SW.TRACKING_INFO.ACTIONS.UPDATED,
            `${currentVersion} extension updated`
          );
          break;
       
        case 'chrome_update':
          AnalyticsHelper.trackEvent(
            'browser',
            SW.TRACKING_INFO.ACTIONS.UPDATED,
            `Chrome updated with ${currentVersion} extension`
          );
          break;
    }
 
 })
};

SW.methods.init = function() {
  // TODO: Change with StorageService later
  SW.methods.createStores();
  SW.methods.submitEvent();

  chrome.storage.onChanged.addListener(SW.methods.updateBadgeText);

  // Add Listener for events from content scripts
  chrome.runtime.onMessage.addListener(SW.methods.contentScriptCommunicator);

  setInterval(SW.methods.fetchNewNotificationsAsync, SW.vars.FETCH_NOTIFICATION_INTERVAL);
  setInterval(SW.methods.fetchUserNotifications, SW.vars.USER_NOTIFICATION_FETCH_INTERVAL);
};

SW.methods.init();
