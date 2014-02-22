SW.methods.isUserInStore = function(userId) {
  for (var i=0; i < SW.stores.userStore.length; i++) {
    if (SW.stores.userStore[i].userId == userId) {
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
