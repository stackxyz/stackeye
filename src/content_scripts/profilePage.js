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
  var $target = $('#user-displayname'),
    notificationText = '';

  $followButton = $('<button></button>').attr({ id: 'se_follow_button' })
    .click(function() {
      var action = $(this).attr('data-action');
    });

  $notificationDiv.click(function() {
    $(this).hide();
  });

  $target.after($followButton);
  $(document.body).append($notificationDiv);
}

function updateFollowButton(followStatus) {

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
    buttonName = 'Following';
  } else {
    className = 'se_follow';
    action = 'followUser';
    buttonName = 'Follow';
  }

  $followButton.attr({ class: className, 'data-action': action }).html(buttonName);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.messageType == 'followStatus') {
    updateFollowButton(request.followStatus);
  }
});

$(document).ready(notifyBackgroundForPageLoad);