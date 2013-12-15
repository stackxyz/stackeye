var BG = chrome.extension.getBackgroundPage();

var NotificationPage = {};
NotificationPage.vars = {};
NotificationPage.methods = {};
NotificationPage.vars.notifications = BG.SW.stores.notificationStore;
NotificationPage.vars.$notificationList = $('#notification-area').find('.notification-list');

var NP = {};
NP.vars = {};
NP.methods = {};
NP.vars.notificationSelector = null;
NP.vars.questionList = null;
NP.vars.$notificationDeleteButton = $('#notification-deleter');

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
};

NotificationPage.methods.renderNotifications = function() {
  var notificationList = NotificationPage.vars.notifications,
    notificationListLength = NotificationPage.vars.notifications.length,
    notificationToShow;

  for (var i = 0; i < notificationListLength; i++) {
    notificationToShow = NotificationPage.methods.getNotificationToShow(notificationList[i]);
    $('<li>').html(notificationToShow).appendTo(NotificationPage.vars.$notificationList);
  }
};

NP.methods.updateNotificationDeleteButton = function() {
  var selectedItems = NP.vars.notificationSelector.getSelectedItems();
  if (selectedItems.length) {
    NP.vars.$notificationDeleteButton.removeAttr('disabled');
  } else {
    NP.vars.$notificationDeleteButton.attr('disabled', true);
  }
};

NP.methods.initializeNotificationComponent = function() {
  NP.vars.notificationSelector = new ListItemSelector({
    multiSelectMode: true,
    el: '.notification-list',
    activeItemClassName: 'se-active',
    selectedItemClassName: 'se-selected'
  });

  $(NP.vars.notificationSelector).on('item:click', NP.methods.updateNotificationDeleteButton.bind(this));
};

NP.methods.removeSelectedNotifications = function() {
  var selectedItems = NP.vars.notificationSelector.getSelectedItems(),
    questionURLs = [];

  $.each(selectedItems, function(item) {
    var url = $(this).find('.question-link').attr('href');
    questionURLs.push(url);
    $(this).remove();
  });

  NP.methods.updateNotificationDeleteButton();
  BG.SW.methods.clearBulkNotifications(questionURLs);
};

NP.methods.init = function() {
  NotificationPage.methods.renderNotifications();
  NP.methods.initializeNotificationComponent();
};

NP.methods.init();
NP.vars.$notificationDeleteButton.click(NP.methods.removeSelectedNotifications.bind(this));