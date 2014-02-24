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
    objectKey = 'user' + ':' + userDetailsObject['user_id'];
    SW.methods.saveObject(userDetailsObject, function() {
      callback();
      SW.methods.addObjectToStore(userDetailsObject);
    }, objectKey);
  }
};
