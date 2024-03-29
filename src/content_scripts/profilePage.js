var $followButton = null,
  $notificationDiv = $('<div></div>').attr({id: 'se_notifier'});

function sendMessageToBackground(message, callback) {
  chrome.runtime.sendMessage(message, callback);
}

function notifyBackgroundForPageLoad() {
  var url = window.location.href,
    message = { event: 'pageLoaded', url: url, pageType: 'profilePage' };

  sendMessageToBackground(message, function() {});
}

function createFollowButton() {
  var url = window.location.href,
    username = url.split('/')[5],
    $target = $('#user-card .profile-avatar, #user-displayname, #mainbar-full .js-user-header'),
    notificationText = '';

  username = username.split('-').join(' ');
  username = username.split('#')[0];
  username = username.split('?')[0];

  $followButton = $('<button></button>')
    .attr({ id: 'se_follow_button' })
    .click(function() {
      const action = $(this).attr('data-action');

      // Update the follow button state ASAP. In case follow/un-follow fails,
      // the same is handled when message is received from background script.
      updateFollowButton(action === 'followUser');

      if (action === 'followUser') {
        notificationText = 'You are now following ' + username;
      } else {
        notificationText = 'You are no longer following ' + username;
      }

      showNotification({type: 'se_notice', message: notificationText});
      sendMessageToBackground({ action: action, url: url }, function(){ } );
    });

  $notificationDiv.click(function() {
    $(this).hide();
  });

  $target.append($followButton);
  $(document.body).append($notificationDiv);
}

function updateFollowButton(followStatus) {
  var className, action, buttonName;

  if (!$followButton) {
    createFollowButton();
  } else {
    setTimeout(function() {
      $notificationDiv.fadeOut(1000);
    }, 3000);
  }

  if (followStatus) {
    className = 'se_following';
    action = 'unfollowUser';
    buttonName = 'Unfollow';
  } else {
    className = 'se_follow';
    action = 'followUser';
    buttonName = 'Follow';
  }

  $followButton.attr({ class: className, 'data-action': action }).html(buttonName);
}

function showNotification(notification) {
  $notificationDiv.text(notification.message)
    .removeClass('se_notice se_error se_success').addClass(notification.type)
    .fadeIn(1000);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.messageType === 'followStatus') {
    updateFollowButton(request.followStatus);
  }
});

$(document).ready(notifyBackgroundForPageLoad);
