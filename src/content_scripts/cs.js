var $watchIcon = null,
  $notificationDiv = $('<div></div>').attr({id: 'se_notifier', title: 'Click to close'}),
  $target = null,
  $watchStatusNotificationDiv = $('<div></div>').attr({id: 'se_watch_status_notifier'});

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
  var url = window.location.href,
    imageUrl = chrome.extension.getURL('resources/images/icon_grey_19.png');

  $watchIcon = $('<img>').attr({ id: 'watchIcon', src: imageUrl })
    .click(function() {
      var action = $(this).attr('data-action');
  
      // Update the watch button state ASAP.
      // In case watch/un-watch fails, the same is handled when message received
      // from background script.
      updateWatchIcon(action == 'watchPage');
  
      sendMessageToBackground({ action: action, url: url }, function(){ } );
   });

  $notificationDiv.click(function() {
    $(this).css('visibility', 'hidden');
  });

  $target = $('#question').find('div.vote').first();
  $target.append($watchIcon);
  $target.append($notificationDiv);
  $(document.body).append($watchStatusNotificationDiv);
}

function updateWatchIcon(watchStatus) {
  var imageUrl;

  if (!$watchIcon) {
    createWatchIcon();
  }
  else {
    $watchStatusNotificationDiv.css('opacity','1');
    setTimeout(function() {
    $watchStatusNotificationDiv.fadeTo(1000,0);
  }, 3*1000);
  }


  if (watchStatus) {
    imageUrl = chrome.extension.getURL('resources/images/icon_color_19.png');
    action = 'unwatchPage';
    $watchStatusNotificationDiv.text('Question has been added to watch list');
  } else {
    imageUrl = chrome.extension.getURL('resources/images/icon_grey_19.png');
    action = 'watchPage';
    $watchStatusNotificationDiv.text('Question has been removed from watch list');
  }

  $watchIcon.attr({ src: imageUrl, 'data-action': action });
}

function showNotification(notification) {
  $notificationDiv.text(notification.message)
    .removeClass('se_warning se_error se_success').addClass(notification.type)
    .css('visibility', 'none');
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.messageType == 'watchStatus') {
    updateWatchIcon(request.watchStatus);
  } else if (request.messageType == 'notification') {
    showNotification({ type: request.type, message: request.message });
  }
});

$(document).ready(notifyBackgroundForPageLoad);