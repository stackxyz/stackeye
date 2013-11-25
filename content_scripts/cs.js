function sendMessageToBackground(message, callback) {
  chrome.runtime.sendMessage(message, callback);
}


function notifyBackgroundForPageLoad() {
  var url = window.location.href,
    message = {
      event: 'pageLoaded',
      url: url
    };

  sendMessageToBackground(message, function() {
  });
};

$(document).ready(notifyBackgroundForPageLoad);