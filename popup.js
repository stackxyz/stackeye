var BG = chrome.extension.getBackgroundPage();
var Popup = {};
Popup.methods = {};
Popup.vars = {};

Popup.vars.busyWatching = false;
Popup.vars.numNotificationsToShow = 5;
Popup.vars.$watchButton = $('#swo_watch_button');
Popup.vars.$unwatchButton = $('#swo_unwatch_button');
Popup.vars.$notificationList = $('#notification-area').find('.notification-list');
Popup.vars.notifications = BG.SW.stores.notificationStore;
Popup.vars.$viewNotificationsButton = $("#swo_view_notifications_button");

Popup.methods.watchSuccess = function(message) {
  if (message) {
    Popup.vars.$watchButton.hide();
    Popup.vars.$unwatchButton.show();
  }
};

Popup.methods.watchCurrentPage = function() {
  if (!Popup.vars.busyWatching) {
    Popup.vars.busyWatching = true;
    BG.SW.methods.startWatchingActiveTabPage(Popup.methods.watchSuccess);
    Popup.vars.busyWatching = false;
  }
};

Popup.methods.unwatchCurrentPage = function() {
  BG.SW.methods.unwatchActiveTabPage();
};

Popup.methods.getNotificationToShow = function(notificationObject) {
  var text = '',
    markup = '',
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
            '<a class="question-link" href="' + notificationObject.link + '">' + notificationObject.title + '</a>' +
            '</div>';

  return markup;
}

Popup.methods.renderNotifications = function() {
  // TODO @SachinJ: Use document fragment here
  var notificationList = Popup.vars.notifications,
    notificationListLength = Popup.vars.notifications.length,
    notificationToShow;

  // TODO @SachinJ: Sort the notification list by latest answer/comment

  Popup.vars.$notificationList.empty();

  for (var i = 0; i < notificationListLength && i < Popup.vars.numNotificationsToShow; i++) {
    notificationToShow = Popup.methods.getNotificationToShow(notificationList[i]);
    $('<li>').html(notificationToShow).appendTo(Popup.vars.$notificationList);
  }
};

Popup.methods.updateCurrentPage = function() {
  Popup.methods.renderNotifications();
};

Popup.methods.init = function() {
  BG.SW.methods.isPagebeingWatched(Popup.methods.watchSuccess);
  Popup.methods.updateCurrentPage();
};

Popup.methods.openQuestionInTab = function(evt) {
  var href = evt.target.href;

  chrome.tabs.create({
    active: true,
    url: href
  }, null);

  return false;
}

Popup.methods.viewAllNotificationsInTab = function(evt) {
  chrome.tabs.create({
    active: true,
    url: 'notifications.html'
  }, null);

  return false;
}

Popup.methods.init();

// All Event listeners go here
Popup.vars.$watchButton.click(Popup.methods.watchCurrentPage);
$('#notification-area').find('.question-link').click(Popup.methods.openQuestionInTab);
Popup.vars.$viewNotificationsButton.click(Popup.methods.viewAllNotificationsInTab);
Popup.vars.$unwatchButton.click(Popup.methods.unwatchCurrentPage);
