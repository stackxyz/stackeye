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


// WatchEye DOM Element
var watchEye;

 // Create WatchEye Element and register for events.
function createWatchEye() {
  watchEye = document.createElement('img');
  watchEye.id = 'watchEye';
  $('div.vote').first().append(watchEye);
  watchEye.onclick = function() {
    sendMessageToBackground({action: 'watchPage'}, function() {});
  }
}

function updateWatchButton(isWatching) {
  if (!watchEye) {
    createWatchEye();
  }
  
  watchEye.src = chrome.extension.getURL(isWatching ? "images/icon_color_19.png" : "images/icon_grey_19.png");
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.messageType == 'watchStatus') {
    updateWatchButton(request.watchStatus);
  }
});

$(document).ready(notifyBackgroundForPageLoad);
