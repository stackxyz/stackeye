$(function() {
  var BG = chrome.extension.getBackgroundPage();
  var SW = SW || BG.SW;

  var NP = NP || {};
  NP.vars = NP.vars || {};
  NP.methods = NP.methods || {};

  // Cache all stores types in local variable
  NP.vars.notifications = BG.SW.stores.notificationStore;
  NP.vars.userNotifications = BG.SW.stores.userNotificationStore;
  NP.vars.questions = BG.SW.stores.questionFeedStore;

  NP.vars.$userNotificationList = $('#user-notification-area').find('.se-list');
  NP.vars.$questionList = $('#question-area').find('.se-list');
  NP.vars.$notificationList = $('#notification-area').find('.se-list');

  NP.vars.$notificationDeleteButton = $('#notification-deleter');
  NP.vars.$notificationDeleteAllButton = $('#notification-deleter-all');
  NP.vars.$questionDeleteButton = $('#question-deleter');
  NP.vars.$questionDeleteAllButton = $('#question-deleter-all');

  NP.vars.notificationSelector = null;

  NP.methods.getQuestionToShow = function(questionObject) {
    var markup = '<div class="lower-row">' +
      '<img src="https://www.google.com/s2/favicons?domain=' + questionObject.domain + '"/>' +
      '<a class="link" target="_blank" href="' + questionObject.link + '">' + questionObject.title + '</a>' +
    '</div>';

    return markup;
  };

  NP.methods.showDefaultNotificationTemplate = function($container) {
    $container.html('<div class="default-template">Hooray!! No Unread Notifications</div>');
  };

  NP.methods.renderItems = function(notificationList, $listContainer, getMarkupMethod) {
    var notificationListLength = notificationList.length,
      notificationToShow;

    if (!notificationListLength) {
      NP.methods.showDefaultNotificationTemplate($listContainer);
    } else {
       $listContainer.empty();
       for (var i = 0; i < notificationListLength; i++) {
          if (notificationList[i]) {
            notificationToShow = getMarkupMethod(notificationList[i]);
            $('<li></li>').html(notificationToShow).appendTo($listContainer);
          }
       }
    }
  };

  NP.methods.showDefaultQuestionTemplate = function() {
    var defaultTemplate = '<div class="default-template">Too Bad!! You are not watching any question</div>';
    NP.vars.$questionList.html(defaultTemplate);
  };

  NP.methods.renderQuestions = function() {
    var questionList = NP.vars.questions,
      numQuestions = questionList.length,
      questionToShow;

    if (!numQuestions) {
       NP.methods.showDefaultQuestionTemplate();
    } else {
       NP.vars.$questionList.html('');
       for (var i = 0; i < numQuestions; i++) {
          questionToShow = NP.methods.getQuestionToShow(questionList[i]);
          $('<li></li>').html(questionToShow).appendTo(NP.vars.$questionList);
       }
    }
  };

  NP.methods.updateNotificationDeleteButton = function() {
    var selectedItems = NP.vars.notificationSelector.getSelectedItems(),
      disableStatus = (selectedItems.length == 0);
    NP.vars.$notificationDeleteButton.attr('disabled', disableStatus);
  };

  NP.methods.updateNotificationDeleteAllButton = function() {
    var notificationList = NP.vars.notifications,
      disableStatus = (notificationList.length == 0);
    NP.vars.$notificationDeleteAllButton.attr('disabled', disableStatus);
  };

  NP.methods.updateQuestionDeleteAllButton = function() {
    var questionList = NP.vars.questions,
      disableStatus = (questionList.length == 0);
    NP.vars.$questionDeleteAllButton.attr('disabled', disableStatus);
  };

  NP.methods.updateQuestionDeleteButton = function() {
    var selectedItems = NP.vars.questionSelector.getSelectedItems(),
      disableStatus = (selectedItems.length == 0);
    NP.vars.$questionDeleteButton.attr('disabled', disableStatus);
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

  NP.methods.removeNotificationListItems = function(notificationListItems) {
    var notificationURLs = [];

    $.each(notificationListItems, function(item) {
      var url = $(this).find('.link').attr('href');
      notificationURLs.push(url);
      $(this).remove();
    });

    BG.SW.methods.removeBulkNotifications(notificationURLs);
    //if we don't have any notifications to show, we show the default template.
    if (NP.vars.notifications.length == 0) {
      NP.methods.showDefaultNotificationTemplate($(notificationListItems).eq(0).parent());
    }
    NP.methods.updateNotificationDeleteButton();
    NP.methods.updateNotificationDeleteAllButton();
  };

  NP.methods.removeQuestionListItems = function(questionListItems) {
    var questionURLs = [];

    $.each(questionListItems, function(item) {
      var url = $(this).find('.question-link').attr('href');
      questionURLs.push(url);
      $(this).remove();
    });

    BG.SW.methods.removeBulkQuestions(questionURLs);
    //if we don't have any questions to show, we show the default template.
    if(NP.vars.questions.length == 0)
       NP.methods.showDefaultQuestionTemplate();
    NP.methods.updateQuestionDeleteButton();
    NP.methods.updateQuestionDeleteAllButton();
  };

  NP.methods.removeSelectedNotifications = function() {
    var selectedItems = NP.vars.notificationSelector.getSelectedItems();

    if (window.confirm(SW.messages.CONFIRM_SELECTED_NOTIFICATIONS_DELETE)) {
      NP.methods.removeNotificationListItems(selectedItems);
    }
  };

  NP.methods.removeAllNotifications = function() {
    var allNotificationItems = NP.vars.notificationSelector.getAllListItems();

    if (window.confirm(SW.messages.CONFIRM_ALL_NOTIFICATIONS_DELETE)) {
      NP.methods.removeNotificationListItems(allNotificationItems);
    }
  };

  NP.methods.removeSelectedQuestions = function() {
    var selectedItems = NP.vars.questionSelector.getSelectedItems();

    if (window.confirm(SW.messages.CONFIRM_SELECTED_QUESTIONS_DELETE)) {
      NP.methods.removeQuestionListItems(selectedItems);
    }
  };

  NP.methods.removeAllQuestions = function() {
    var allQuestionsItems = NP.vars.questionSelector.getAllListItems();

    if (window.confirm(SW.messages.CONFIRM_ALL_QUESTIONS_DELETE)) {
      NP.methods.removeQuestionListItems(allQuestionsItems);
    }
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
    NP.methods.renderItems(
      NP.vars.notifications,
      NP.vars.$notificationList,
      Shared.methods.getNotificationToShow
    );

    NP.methods.renderItems(
      NP.vars.userNotifications,
      NP.vars.$userNotificationList,
      Shared.methods.getUserNotificationMarkup
    );

    NP.methods.renderQuestions();
    NP.methods.initializeNotificationSelectorComponent();
    NP.methods.initializeQuestionSelectorComponent();
    NP.methods.updateNotificationDeleteAllButton();
    NP.methods.updateQuestionDeleteAllButton();
  };

  NP.methods.init();
  NP.vars.$notificationDeleteButton.click(NP.methods.removeSelectedNotifications);
  NP.vars.$notificationDeleteAllButton.click(NP.methods.removeAllNotifications);
  NP.vars.$questionDeleteButton.click(NP.methods.removeSelectedQuestions);
  NP.vars.$questionDeleteAllButton.click(NP.methods.removeAllQuestions);
  $('.se-tab').click(NP.methods.showTab);
});