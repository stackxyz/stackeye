var $watchIcon = null;

function sendMessageToBackground(message, callback) {
  chrome.runtime.sendMessage(message, callback);
}

function notifyBackgroundForPageLoad() {
  var url = window.location.href,
    message = {
      event: 'pageLoaded',
      url: url
    };

  sendMessageToBackground(message, function() {});
}

function createWatchIcon() {
  var imageUrl = chrome.extension.getURL('images/icon_grey_19.png');

  $watchIcon = $('<img>').attr({ id: 'watchIcon', src: imageUrl })
    .click(function() {
      var action = $(this).attr('data-action');
      sendMessageToBackground({action: action}, function(){} );
   });

  $('#question').find('div.vote').first().append($watchIcon);
}

function updateWatchIcon(watchStatus) {
  var imageUrl;

  if (!$watchIcon) {
    createWatchIcon();
  }

  if (watchStatus) {
    imageUrl = chrome.extension.getURL('images/icon_color_19.png');
    action = 'unwatchPage';
  } else {
    imageUrl = chrome.extension.getURL('images/icon_grey_19.png');
    action = 'watchPage';
  }

  $watchIcon.attr({ src: imageUrl, 'data-action': action });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.messageType == 'watchStatus') {
    updateWatchIcon(request.watchStatus);
  }
});

$(document).ready(notifyBackgroundForPageLoad);