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

// Create WatchEye Element and register for events.
var watchEye = document.createElement("img");
watchEye.id = "watchEye";
$("div.vote").first().append(watchEye);
watchEye.onclick = function() {
  sendMessageToBackground({event: 'watchPage'}, function() {});
}

function updateWatchButton(isWatching)
{
  watchEye.src = chrome.extension.getURL(isWatching ? "images/icon_color_19.png" : "images/icon_grey_19.png");
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.messageType == 'watchStatus')
      updateWatchButton(request.watchStatus);
  });