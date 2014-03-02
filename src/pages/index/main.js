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
  NP.vars.users = BG.SW.stores.userStore;

  NP.vars.$userNotificationList = $('#user-notification-area').find('.se-list');
  NP.vars.$questionList = $('#question-area').find('.se-list');
  NP.vars.$notificationList = $('#notification-area').find('.se-list');
  NP.vars.$userList = $('#users-area').find('.se-list');

  NP.vars.$notificationDeleteButton = $('#notification-deleter');
  NP.vars.$questionDeleteButton = $('#question-deleter');
  NP.vars.$userDeleteButton = $('#user-deleter');
  NP.vars.$userNotificationsDeleteButton = $('#user-notification-deleter');

  NP.vars.notificationSelector = null;
  NP.vars.questionSelector = null;

  NP.DEFAULT_TEMPLATES = {
    QUESTION: '<div class="default-template">Too Bad!! You are not watching any question</div>',
    QUESTION_NOTIFICATION: '<div class="default-template">Hooray!! No Unread Notifications</div>',
    USER: '<div class="default-template">Too Bad!! You are not following any user</div>',
    USER_NOTIFICATION: '<div class="default-template">Awesome!! No Unread Notification</div>'
  };

  NP.methods.getQuestionMarkup = function(questionObject) {
    var markup = '<div class="lower-row">' +
      '<img src="https://www.google.com/s2/favicons?domain=' + questionObject.domain + '"/>' +
      '<a class="link" target="_blank" href="' + questionObject.link + '">' + questionObject.title + '</a>' +
    '</div>';

    return markup;
  };

  NP.methods.getUserMarkup = function(object) {
    var markup,
      tags = object.tags,
      userProfileLink = '<a class="link username" href="' + object['link'] + '">' + object['display_name'] + '</a>';

    if (tags) {
      tags = tags.split(',');
    } else {
      tags = [];
    }

    markup = '<div class="avatar-container left"><img src="' + object['profile_image'] + '"/></div>';

    markup += '<div class="right content-container">';
    markup += '<div class="upper-row">' + userProfileLink + '</div>';

    markup += '<div class="lower-row">';
    tags.forEach(function(tag, index) {
      if (index < 5) markup += '<span class="tag">' + tag +'</span>'
    });
    markup += '</div>';

    return markup;
  };

  NP.methods.renderItems = function(itemList, $listContainer, getMarkupMethod, defaultMarkup) {
    var notificationListLength = itemList.length,
      notificationToShow,
      $list = $('<ul></ul>');

    $listContainer.html(defaultMarkup);

    for (var i = 0; i < notificationListLength; i++) {
      if (itemList[i]) {
        notificationToShow = getMarkupMethod(itemList[i]);
        $('<li></li>').html(notificationToShow).appendTo($list);
      }
    }

    if (notificationListLength) {
      $listContainer.html($list.html());
    }
  };

  NP.methods.updateDeleteButton = function($button, selectedItemsLength) {
    $button.attr('disabled', (selectedItemsLength == 0));
  };

  NP.methods.updateQuestionDeleteButton = function() {
    var selectedItems = NP.vars.questionSelector.getSelectedItems(),
      disableStatus = (selectedItems.length == 0);
    NP.vars.$questionDeleteButton.attr('disabled', disableStatus);
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
      $(notificationListItems).eq(0).parent().html(NP.DEFAULT_TEMPLATES.QUESTION_NOTIFICATION);
    }

    NP.methods.updateDeleteButton(NP.vars.$notificationDeleteButton,
      NP.vars.notificationSelector.getSelectedItems().length);
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
    if (NP.vars.questions.length == 0)
      $(questionListItems).eq(0).parent().html(NP.DEFAULT_TEMPLATES.QUESTION);
    NP.methods.updateQuestionDeleteButton();
  };

  NP.methods.removeSelectedNotifications = function() {
    var selectedItems = NP.vars.notificationSelector.getSelectedItems();

    if (window.confirm(SW.messages.CONFIRM_SELECTED_NOTIFICATIONS_DELETE)) {
      NP.methods.removeNotificationListItems(selectedItems);
    }
  };

  NP.methods.removeSelectedQuestions = function() {
    var selectedItems = NP.vars.questionSelector.getSelectedItems();

    if (window.confirm(SW.messages.CONFIRM_SELECTED_QUESTIONS_DELETE)) {
      NP.methods.removeQuestionListItems(selectedItems);
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
      Shared.methods.getNotificationToShow,
      NP.DEFAULT_TEMPLATES.QUESTION_NOTIFICATION
    );

    NP.methods.renderItems(
      NP.vars.userNotifications,
      NP.vars.$userNotificationList,
      Shared.methods.getUserNotificationMarkup,
      NP.DEFAULT_TEMPLATES.USER_NOTIFICATION
    );

    NP.methods.renderItems(
      NP.vars.questions,
      NP.vars.$questionList,
      NP.methods.getQuestionMarkup,
      NP.DEFAULT_TEMPLATES.QUESTION
    );

    NP.methods.renderItems(
      NP.vars.users,
      NP.vars.$userList,
      NP.methods.getUserMarkup,
      NP.DEFAULT_TEMPLATES.USER
    );

    NP.vars.questionSelector = new ListItemSelector({
      multiSelectMode: true,
      el: '.question-list',
      activeItemClassName: 'se-active',
      selectedItemClassName: 'se-selected'
    });
    $(NP.vars.questionSelector).on('item:click', function() {
      var selectedItemsLength = NP.vars.questionSelector.getSelectedItems().length;
      NP.vars.updateDeleteButton(NP.vars.$questionDeleteButton, selectedItemsLength);
    });

    NP.vars.notificationSelector = new ListItemSelector({
      multiSelectMode: true,
      el: '.notification-list',
      activeItemClassName: 'se-active',
      selectedItemClassName: 'se-selected'
    });
    $(NP.vars.notificationSelector).on('item:click', function() {
      var selectedItemsLength = NP.vars.notificationSelector.getSelectedItems().length;
      NP.vars.updateDeleteButton(NP.vars.$notificationDeleteButton, selectedItemsLength);
    });

    NP.vars.userSelector = new ListItemSelector({
      multiSelectMode: true,
      el: '.user-list',
      activeItemClassName: 'se-active',
      selectedItemClassName: 'se-selected'
    });
    $(NP.vars.userSelector).on('item:click', function() {
      var selectedItemsLength = NP.vars.userSelector.getSelectedItems().length;
      NP.methods.updateDeleteButton(NP.vars.$userDeleteButton, selectedItemsLength);
    });
  };

  NP.methods.init();
  NP.vars.$notificationDeleteButton.click(NP.methods.removeSelectedNotifications);
  NP.vars.$questionDeleteButton.click(NP.methods.removeSelectedQuestions);
  $('.se-tab').click(NP.methods.showTab);
});