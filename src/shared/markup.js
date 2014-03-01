var Shared = Shared || {};
Shared.methods = Shared.methods || {};

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

  return markup;
};

Shared.methods.getUserNotificationMarkup = function(userNotificationItem) {
  var markup,
    text,
    owner = userNotificationItem.owner,
    postType = userNotificationItem['post_type'],
    questionLink = userNotificationItem.link,
    questionTitle = userNotificationItem.title,
    userProfileLink = '<a class="link username" href="' + owner['link'] + '">' + owner['display_name'] + '</a>';

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

  return markup;
};
