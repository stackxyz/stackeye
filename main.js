var BG = chrome.extension.getBackgroundPage();

var NotificationPage = {};
NotificationPage.vars = {};
NotificationPage.methods = {};
NotificationPage.vars.notifications = BG.SW.stores.notificationStore;
NotificationPage.vars.$notificationList = $('#notification-area').find('.notification-list');

NotificationPage.methods.getNotificationToShow = function(notificationObject) {
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
            '<a class="question-link" target="_blank" href="' + notificationObject.link + '">' + notificationObject.title + '</a>' +
            '</div>';

  return markup;
}

NotificationPage.methods.renderNotifications = function() {
  // TODO @Sachin: Use document fragment here
  var notificationList = NotificationPage.vars.notifications,
    notificationListLength = NotificationPage.vars.notifications.length,
    notificationToShow;

  for (var i = 0; i < notificationListLength; i++) {
    notificationToShow = NotificationPage.methods.getNotificationToShow(notificationList[i]);
    $('<li>').html(notificationToShow).appendTo(NotificationPage.vars.$notificationList);
  }
};

NotificationPage.methods.init = function() {
  NotificationPage.methods.renderNotifications();
}

NotificationPage.methods.init();