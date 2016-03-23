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
  NP.vars.userNotificationSelector = null;

  NP.methods.updateDeleteButton = function($button, selectedItemsLength) {
    $button.attr('disabled', (selectedItemsLength == 0));
  };

  NP.methods.removeSelectedItems = function() {
    var $list = $(this).parents('.category-area').find('.se-list'),
      $selectedItems = $list.find('li.se-selected'),
      message = $(this).attr('data-message'),
      objectType = $(this).attr('data-objectType');

    if (window.confirm(message)) {
      $selectedItems.each(function(index, selectedItem) {
        var objectKey = selectedItem.getAttribute('data-objectKey');
        Shared.methods.removeItem(objectKey, objectType);
        $(selectedItem).remove();
      });
    }

    NP.methods.updateDeleteButton($(this), $list.find('li.se-selected').length);
  };

  NP.methods.removeNotificationItem = function() {
    var $listItem = $(this).parents('li'),
      objectKey = $listItem.attr('data-objectKey'),
      objectType = $listItem.attr('data-objectType');

    // Remove only if this is notification (not users/questions)
    if (objectType != BG.SW.OBJECT_TYPES.NEW_ACTIVITY_NOTIFICATION && objectType != BG.SW.OBJECT_TYPES.USER_NOTIFICATION) {
      return;
    }

    Shared.methods.removeItem(objectKey, objectType);
    $listItem.remove();
  };
  
  NP.methods.init = function() {
    NP.vars.questionSelector = new ListItemSelector({
      multiSelectMode: true,
      el: '.question-list',
      activeItemClassName: 'se-active',
      selectedItemClassName: 'se-selected'
    });
    $(NP.vars.questionSelector).on('item:click', function() {
      var selectedItemsLength = NP.vars.questionSelector.getSelectedItems().length;
      NP.methods.updateDeleteButton(NP.vars.$questionDeleteButton, selectedItemsLength);
    });

    NP.vars.notificationSelector = new ListItemSelector({
      multiSelectMode: true,
      el: '.notification-list',
      activeItemClassName: 'se-active',
      selectedItemClassName: 'se-selected'
    });
    $(NP.vars.notificationSelector).on('item:click', function() {
      var selectedItemsLength = NP.vars.notificationSelector.getSelectedItems().length;
      NP.methods.updateDeleteButton(NP.vars.$notificationDeleteButton, selectedItemsLength);
    });

    NP.vars.userNotificationSelector = new ListItemSelector({
      multiSelectMode: true,
      el: '.user-notification-list',
      activeItemClassName: 'se-active',
      selectedItemClassName: 'se-selected'
    });
    $(NP.vars.userNotificationSelector).on('item:click', function() {
      var selectedItemsLength = NP.vars.userNotificationSelector.getSelectedItems().length;
      NP.methods.updateDeleteButton(NP.vars.$userNotificationsDeleteButton, selectedItemsLength);
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
  $('.deleter').click(NP.methods.removeSelectedItems);
  $('a.link').click(NP.methods.removeNotificationItem);
});