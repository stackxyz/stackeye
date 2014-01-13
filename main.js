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
NP.vars.questions = BG.SW.stores.questionFeedStore;
NP.vars.$questionList = $('#question-area').find('.question-list');
NP.vars.$notificationDeleteButton = $('#notification-deleter');
NP.vars.$questionDeleteButton = $('#question-deleter');

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

NP.methods.getQuestionToShow = function(questionObject) {
  var markup = '<div class="lower-row">' +
    '<img src="https://www.google.com/s2/favicons?domain=' + questionObject.domain + '/>' +
    '<a class="question-link" target="_blank" href="' + questionObject.link + '">' + questionObject.title + '</a>' +
  '</div>';

  return markup;
};

NotificationPage.methods.renderNotifications = function() {
  var notificationList = NotificationPage.vars.notifications,
    notificationListLength = NotificationPage.vars.notifications.length,
    notificationToShow,
    defaultTemplate = '';

  if (!notificationListLength) {
    defaultTemplate = '<div class="default-template">Hooray!! No Unread Notifications</div>';
  }

  NotificationPage.vars.$notificationList.html(defaultTemplate);
  for (var i = 0; i < notificationListLength; i++) {
    notificationToShow = NotificationPage.methods.getNotificationToShow(notificationList[i]);
    $('<li></li>').html(notificationToShow).appendTo(NotificationPage.vars.$notificationList);
  }
};

NP.methods.renderQuestions = function() {
  var questionList = NP.vars.questions,
    numQuestions = questionList.length,
    questionToShow,
    defaultTemplate = '';

  if (!numQuestions) {
    defaultTemplate = '<div class="default-template">Too Bad!! You are not watching any question</div>';
  }

  NP.vars.$questionList.html(defaultTemplate);
  for (var i = 0; i < numQuestions; i++) {
    questionToShow = NP.methods.getQuestionToShow(questionList[i]);
    $('<li></li>').html(questionToShow).appendTo(NP.vars.$questionList);
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

NP.methods.updateQuestionDeleteButton = function() {
  var selectedItems = NP.vars.questionSelector.getSelectedItems();
  if (selectedItems.length) {
    NP.vars.$questionDeleteButton.removeAttr('disabled');
  } else {
    NP.vars.$questionDeleteButton.attr('disabled', true);
  }
};

NP.methods.initializeNotificationSelectorComponent = function() {
  NP.vars.notificationSelector = new ListItemSelector({
    multiSelectMode: true,
    el: '.notification-list',
    activeItemClassName: 'se-active',
    selectedItemClassName: 'se-selected'
  });

  $(NP.vars.notificationSelector).on('item:click', NP.methods.updateNotificationDeleteButton.bind(this));
};

NP.methods.initializeQuestionSelectorComponent = function() {
  NP.vars.questionSelector = new ListItemSelector({
    multiSelectMode: true,
    el: '.question-list',
    activeItemClassName: 'se-active',
    selectedItemClassName: 'se-selected'
  });

  $(NP.vars.questionSelector).on('item:click', NP.methods.updateQuestionDeleteButton.bind(this));
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

NP.methods.removeSelectedQuestions = function() {
  var selectedItems = NP.vars.questionSelector.getSelectedItems(),
    questionURLs = [];

  $.each(selectedItems, function(item) {
    var url = $(this).find('.question-link').attr('href');
    questionURLs.push(url);
    $(this).remove();
  });

  NP.methods.updateQuestionDeleteButton();
  BG.SW.methods.removeBulkQuestions(questionURLs);
};

NP.methods.showTab = function(event) {
  var el = event.target,
    targetId = el.getAttribute('data-targetId');

  $('.pure-menu').find('li').removeClass('pure-menu-selected');
  $(event.target).parent('li').addClass('pure-menu-selected');

  $('.category-area').hide();
  $('#' + targetId).show();

  return false;
};

NP.methods.init = function() {
  NotificationPage.methods.renderNotifications();
  NP.methods.renderQuestions();
  NP.methods.initializeNotificationSelectorComponent();
  NP.methods.initializeQuestionSelectorComponent();
};

NP.methods.init();
NP.vars.$notificationDeleteButton.click(NP.methods.removeSelectedNotifications.bind(this));
NP.vars.$questionDeleteButton.click(NP.methods.removeSelectedQuestions.bind(this));
$('.se-tab').click(NP.methods.showTab);