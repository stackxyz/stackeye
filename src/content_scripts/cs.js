var $watchIcon = null,
  $notificationDiv = $('<div></div>').attr({id: 'se_notifier', title: 'Click to close'}),
  $target = null;

function sendMessageToBackground(message, callback) {
  chrome.runtime.sendMessage(message, callback);
}

function notifyBackgroundForPageLoad() {
  var url = window.location.href,
    message = { event: 'pageLoaded', url: url };

  sendMessageToBackground(message, function() {});
}

function createWatchIcon() {
  var url = window.location.href,
    notificationText = '',
    imageUrl = chrome.extension.getURL('resources/images/icon_grey_19.png');

  $watchIcon = $('<img>').attr({ id: 'watchIcon', src: imageUrl })
    .click(function() {
      var action = $(this).attr('data-action');
  
      // Update the watch button state ASAP. In case watch/un-watch fails,
      // the same is handled when message is received from background script.
      updateWatchIcon(action == 'watchPage');

      notificationText = (action == 'watchPage') ?
        'Question has been added to your watch list' :
        'Question has been removed from watch list';

      showNotification({type: 'se_notice', message: notificationText});
  
      sendMessageToBackground({ action: action, url: url }, function(){ } );
   });

  $notificationDiv.click(function() {
    $(this).hide();
  });

  $target = $('#question').find('div.vote').first();
  $target.append($watchIcon);
  $(document.body).append($notificationDiv);
}

function updateWatchIcon(watchStatus) {
  var imageUrl;

  if (!$watchIcon) {
    createWatchIcon();
  } else {
    setTimeout(function() {
      $notificationDiv.fadeOut(1000);
    }, 3000);
  }

  if (watchStatus) {
    imageUrl = chrome.extension.getURL('resources/images/icon_color_19.png');
    action = 'unwatchPage';
  } else {
    imageUrl = chrome.extension.getURL('resources/images/icon_grey_19.png');
    action = 'watchPage';
  }

  $watchIcon.attr({ src: imageUrl, 'data-action': action });
}

function showNotification(notification) {
  $notificationDiv.text(notification.message)
    .removeClass('se_notice se_error se_success').addClass(notification.type)
    .fadeIn(1000);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.messageType == 'watchStatus') {
    updateWatchIcon(request.watchStatus);
  } else if (request.messageType == 'notification') {
    showNotification({ type: request.type, message: request.message });
  }
});

$(document).ready(notifyBackgroundForPageLoad);