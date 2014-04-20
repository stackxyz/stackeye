var BG = chrome.extension.getBackgroundPage();
var Shared = Shared || {};
Shared.methods = Shared.methods || {};

Shared.DEFAULT_TEMPLATES = {
  QUESTION: '<div class="default-template">Too Bad!! You are not watching any question</div>',
  QUESTION_NOTIFICATION: '<div class="default-template">Hooray!! No Unread Notifications</div>',
  USER: '<div class="default-template">Too Bad!! You are not following any user</div>',
  USER_NOTIFICATION: '<div class="default-template">Awesome!! No Unread Notification</div>'
};

Shared.methods.getNotificationToShow = function(notificationObject) {
  var text = '',
    markup,
    numAnswers = notificationObject.numAnswers,
    numComments = notificationObject.numComments;

  if (numAnswers != 0 && numComments != 0) {
    text = '<span class="bold">' + numAnswers + ' answers and ' + numComments + ' comments <span>';
  } else if (numAnswers !=0 && numComments == 0) {
    text = '<span class="bold">' + numAnswers + ' answers <span>';
  } else if (numAnswers == 0 && numComments != 0) {
    text = '<span class="bold">' + numComments + ' comments <span>';
  }

  markup = '<div class="upper-row">' + text + ' on' + '</div>';
  markup += '<div class="lower-row">' +
    '<a class="link" target="_blank" href="' + notificationObject.link + '">' + notificationObject.title + '</a>' +
    '</div>';

  // Add trash icon from Font Awesome
  markup += '<i class="fa fa-trash-o fa-fw display-none trash-icon" title="Delete Notification"></i>';

  return markup;
};

Shared.methods.getUserNotificationMarkup = function(userNotificationItem) {
  var markup,
    text,
    owner = userNotificationItem.owner,
    postType = userNotificationItem['post_type'],
    questionLink = userNotificationItem.link,
    questionTitle = userNotificationItem.title,
    userProfileLink = '<a class="profile-link username" href="' + owner['link'] + '">' + owner['display_name'] + '</a>';

  markup = '<div class="avatar-container left"><img src="' + owner['profile_image'] + '"/></div>';

  if (postType == 'question') {
    text = '<span>' + userProfileLink + ' has asked a question' + '</span>';
  }

  if (postType == 'answer') {
    text = '<span>' + userProfileLink + ' answered on' + '</span>';
  }

  markup += '<div class="right content-container">';
  markup += '<div class="upper-row">' + text + '</div>';
  markup += '<div class="lower-row">' +
    '<a class="link" target="_blank" href="' + questionLink + '">' + questionTitle + '</a>' +
    '</div>';
  markup += '</div>';

  // Add trash icon from Font Awesome
  markup += '<i class="fa fa-trash-o fa-fw display-none trash-icon" title="Delete Notification"></i>';

  return markup;
};

Shared.methods.renderItems = function(itemList, $listContainer, getMarkupMethod, defaultMarkup) {
  var notificationListLength = itemList.length,
    notificationToShow,
    $list = $('<ul></ul>');

  $listContainer.html(defaultMarkup);

  for (var i = 0; i < notificationListLength; i++) {
    var object = itemList[i];
    if (object) {
      notificationToShow = getMarkupMethod(object, i);
      $('<li></li>').attr({'data-objectKey': object.objectKey, 'data-objectType': object.objectType })
        .html(notificationToShow).appendTo($list);
    }
  }

  if (notificationListLength) {
    $listContainer.html($list.html());
  }
};

Shared.methods.removeItem = function(objectKey, objectType) {
  var store = BG.SW.maps.ObjectTypeToStoreMap[objectType];

  BG.SW.methods.removeObjectFromStore(objectKey, store);
  BG.SW.methods.deleteObject(objectKey);
  BG.SW.methods.updateBadgeText();
};
