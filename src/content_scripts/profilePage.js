function sendMessageToBackground(message, callback) {
  chrome.runtime.sendMessage(message, callback);
}

function notifyBackgroundForPageLoad() {
  var url = window.location.href,
    message = { event: 'pageLoaded', url: url, pageType: 'profilePage' };

  sendMessageToBackground(message, function() {});
}

function updateFollowButton(followStatus) {
  alert(followStatus);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.messageType == 'followStatus') {
    updateFollowButton(request.followStatus);
  }
});

$(document).ready(notifyBackgroundForPageLoad);