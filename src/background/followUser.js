SW.methods.isUserInStore = function(userId) {
  for (var i=0; i < SW.stores.userStore.length; i++) {
    if (SW.stores.userStore[i]['user_id'] == userId) {
      return true;
    }
  }

  return false;
};

SW.methods.isUserFollowed = function(profilePageUrl, callback) {
  var urlInfo = SW.methods.extractProfilePageUrlInfo(profilePageUrl),
    isUrlValid,
    followStatus = false;

  isUrlValid = SW.methods.validateUrl(profilePageUrl);
  if (isUrlValid) {
    followStatus = SW.methods.isUserInStore(urlInfo.userId);
    callback(followStatus, profilePageUrl);
  }
};

SW.methods.followUser = function(profilePageUrl, callback) {
  var urlInfo = SW.methods.extractProfilePageUrlInfo(profilePageUrl),
    userDetailsObject = SW.methods.getUserDetails(urlInfo.userId, urlInfo.domain),
    objectKey;

  callback = callback || function() {};

  if (userDetailsObject) {
    userDetailsObject['objectType'] = SW.OBJECT_TYPES.USER;
    userDetailsObject['domain'] = urlInfo.domain;

    objectKey = 'user' + ':' + userDetailsObject['user_id'];
    SW.methods.saveObject(userDetailsObject, function() {
      callback();
      SW.methods.addObjectToStore(userDetailsObject);
    }, objectKey);
  }
};

/**
 * Fetches notifications for list of users corresponding to a domain
 * @param userIds
 * @param domain
 */
SW.methods.fetchUserNotification = function(userIds, domain) {
  var notificationItem,
    objectKey,
    currentTime = parseInt(Date.now()/1000),
    fromDate = currentTime - SW.vars.TIME.T_30_MIN,
    notifications = SW.methods.getUserNotifications(userIds, domain, fromDate);

  for (var i = 0; i < notifications.length; i++) {
    notificationItem = notifications[i];
    objectKey = SW.OBJECT_TYPES.USER_NOTIFICATION + ':' + notificationItem['post_id'];
    notificationItem['objectType'] = SW.OBJECT_TYPES.USER_NOTIFICATION;

    SW.methods.saveObject(notificationItem, function() {
      SW.methods.addObjectToStore(notificationItem);
    }, objectKey);
  }
};

/**
 * Fetches notifications for all domains and all users
 */
SW.methods.fetchUserNotifications = function() {
  var usersInSite = SW.methods.createMapOfUsersInDomain();

  for (var site in usersInSite) {
    SW.methods.fetchUserNotification(usersInSite[site], site);
  }
};

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
