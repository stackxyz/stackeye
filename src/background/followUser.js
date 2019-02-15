SW.methods.isUserInStore = function(userId) {
  for (var i=0; i < SW.stores.userStore.length; i++) {
    if (SW.stores.userStore[i]['user_id'] == userId) {
      return true;
    }
  }

  return false;
};

SW.methods.isUserFollowed = function(profilePageUrl) {
  const urlInfo = SW.methods.extractProfilePageUrlInfo(profilePageUrl),
    isUrlValid = SW.methods.validateUrl(profilePageUrl);

  return isUrlValid
    ? SW.methods.isUserInStore(urlInfo.userId)
    : null;
};

/**
 *
 * @param profilePageUrl
 */
SW.methods.followUserAsync = async function(profilePageUrl) {
  var urlInfo = SW.methods.extractProfilePageUrlInfo(profilePageUrl),
    userDetailsObject = await SW.methods.getUserDetailsAsync(urlInfo.userId, urlInfo.domain),
    userTags = await SW.methods.fetchUserTagsAsync([urlInfo.userId], urlInfo.domain) || [],
    objectKey;

  const tags = [];
  userTags.forEach(function(tagObject) {
    tags.push(tagObject.name);
  });

  if (userDetailsObject) {
    userDetailsObject['objectType'] = SW.OBJECT_TYPES.USER;
    userDetailsObject['domain'] = urlInfo.domain;
    userDetailsObject['tags'] = tags.join(',');

    objectKey = 'user' + ':' + userDetailsObject['user_id'];
    await SW.methods.saveObject(userDetailsObject, objectKey);
    SW.methods.addObjectToStore(userDetailsObject);
  }
};

/**
 * Unfollow user
 * @param profilePageUrl
 */
SW.methods.unfollowUserAsync = async function(profilePageUrl) {
  const urlInfo = SW.methods.extractProfilePageUrlInfo(profilePageUrl),
    objectKey = SW.OBJECT_TYPES.USER + ':' + urlInfo.userId;

  SW.methods.removeObjectFromStore(objectKey, SW.stores.userStore);
  await SW.methods.deleteObject(objectKey);
};

/**
 * Fetches notifications for list of users corresponding to a domain
 * @param userIds
 * @param domain
 * @param fromDate
 */
SW.methods.fetchUserNotificationAsync = async function(userIds, domain, fromDate) {
  var notificationItem,
    objectKey,
    notifications = await SW.methods.getUserNotificationsAsync(userIds, domain, fromDate);

  for (var i = 0; i < notifications.length; i++) {
    notificationItem = notifications[i];
    objectKey = SW.OBJECT_TYPES.USER_NOTIFICATION + ':' + notificationItem['post_id'];
    notificationItem['objectType'] = SW.OBJECT_TYPES.USER_NOTIFICATION;
    notificationItem['domain'] = domain;

    SW.methods.addObjectToStore(notificationItem);
    SW.methods.saveObject(notificationItem, objectKey).then();
  }
};

/**
 * Fetches notifications for all domains and all users
 */
SW.methods.fetchUserNotifications = function() {
  var usersInSite = SW.methods.createMapOfUsersInDomain(),
    currentTime = parseInt((Date.now()/1000).toString()),
    fromDate = currentTime - SW.vars.TIME.T_30_MIN;

  chrome.storage.local.get('userNotificationsLastFetchDate', async function (o) {
    const lastFetchDate = o['userNotificationsLastFetchDate'] || fromDate;

    for (const site in usersInSite) {
      // This might be slow (await in a loop), but if we fire them all off at once,
      // we might trip the rate limiter.
      await SW.methods.fetchUserNotificationAsync(usersInSite[site], site,
        lastFetchDate);
    }

    chrome.storage.local.set({ userNotificationsLastFetchDate: currentTime });
  });
};

SW.methods.getUserObjectFromStore = function(objectKey) {
  var result = {};
  SW.stores.userStore.forEach(function(userObject) {
    if (userObject['objectKey'] === objectKey) {
      result = userObject;
    }
  });

  return result;
};

/**
 *
 * @returns {{}}
 */
SW.methods.createMapOfUsersInDomain = function() {
  var usersInSite = {},
    domain,
    userId;

  // Create a map of domain -> userIds
  for (var i = 0; i < SW.stores.userStore.length; i++) {
    domain = SW.stores.userStore[i]['domain'];
    userId = SW.stores.userStore[i]['user_id'];

    usersInSite[domain] = usersInSite[domain] || [];
    usersInSite[domain].push(userId);
  }

  return usersInSite;
};

// Whenever extension is reloaded (browser reopened/extension re-enabled, fetch userNotifications
$(document).on('stores:created', SW.methods.fetchUserNotifications);
