var BG = chrome.extension.getBackgroundPage();
var Popup = {};
Popup.methods = {};
Popup.vars = {};

Popup.vars.numNotificationsToShow = 5;
Popup.vars.$notificationList = $('#notification-area').find('.notification-list');
Popup.vars.notifications = BG.SW.stores.notificationStore;
Popup.vars.$viewNotificationsButton = $("#swo_view_notifications_button");

Popup.methods.getNotificationToShow = function(notificationObject) {
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
            '<a class="question-link" href="' + notificationObject.link + '">' + notificationObject.title + '</a>' +
            '</div>';

  return markup;
};

Popup.methods.renderNotifications = function() {
  // TODO(@SachinJ): Use document fragment here
  var notificationList = Popup.vars.notifications,
    notificationListLength = Popup.vars.notifications.length,
    notificationToShow;

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
  Popup.methods.updateCurrentPage();
};

Popup.methods.createNewTab = function(options) {
  if (!options.url) {
    return false;
  }

  options.active = options.active || true; //Default value
  chrome.tabs.create({
    active: options.active,
    url: options.url
  }, null);
};

Popup.methods.openQuestionInTab = function(evt) {
  var href = evt.target.href;

  Popup.methods.createNewTab({ active: true, url: href });
  return false;
};

Popup.methods.viewAllNotificationsInTab = function(evt) {
  var url = 'notifications.html';

  Popup.methods.createNewTab({ active: true, url: url });
  return false;
};

Popup.methods.init();

// All Event listeners go here
$('#notification-area').find('.question-link').click(Popup.methods.openQuestionInTab);
Popup.vars.$viewNotificationsButton.click(Popup.methods.viewAllNotificationsInTab);
