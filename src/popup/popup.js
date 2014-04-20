$(function() {
  var BG = chrome.extension.getBackgroundPage();
  var Popup = {};
  Popup.methods = {};
  Popup.vars = {};

  Popup.vars.numNotificationsToShow = 5;
  Popup.vars.$notificationList = $('#notification-area').find('.notification-list');
  Popup.vars.$userNotificationList = $('#user-notification-area').find('.user-notification-list');
  Popup.vars.notifications = BG.SW.stores.notificationStore;
  Popup.vars.userNotifications = BG.SW.stores.userNotificationStore;
  Popup.vars.$viewNotificationsButton = $("#swo_view_notifications");

  Popup.methods.updateCurrentPage = function() {
    Shared.methods.renderItems(
      Popup.vars.notifications,
      Popup.vars.$notificationList,
      Shared.methods.getNotificationToShow,
      Shared.DEFAULT_TEMPLATES.QUESTION_NOTIFICATION);

    Shared.methods.renderItems(
      Popup.vars.userNotifications,
      Popup.vars.$userNotificationList,
      Shared.methods.getUserNotificationMarkup,
      Shared.DEFAULT_TEMPLATES.USER_NOTIFICATION);

    // Show the number along side with tab names like Questions[3] and Users[5]
    $('.tabContainer').find('a').each(function(index, tab) {
      var area = tab.getAttribute('data-targetId'),
        numItems = 0;

      switch (area) {
        case 'notification-area':
          numItems = BG.SW.stores.notificationStore.length;
          break;

        case 'user-notification-area':
          numItems = BG.SW.stores.userNotificationStore.length;
          break;

        case 'question-area':
          numItems = BG.SW.stores.questionFeedStore.length;
          break;

        case 'users-area':
          numItems = BG.SW.stores.userStore.length;
          break;
      }

      $(tab).find('span').html(numItems);
    });
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
    var href = evt.target.href,
      $listItem = $(this).parents('li'),
      objectKey = $listItem.attr('data-objectKey'),
      objectType = $listItem.attr('data-objectType');

    Shared.methods.removeItem(objectKey, objectType);

    Popup.methods.createNewTab({ active: true, url: href });
    return false;
  };

  Popup.methods.removeNotification = function() {
    var $listItem = $(this).parents('li'),
      objectKey = $listItem.attr('data-objectKey'),
      objectType = $listItem.attr('data-objectType');

    Shared.methods.removeItem(objectKey, objectType);
    Popup.methods.updateCurrentPage();
    return false;
  };

  Popup.methods.viewAllNotificationsInTab = function(evt) {
    var url = 'src/pages/index/index.html';

    Popup.methods.createNewTab({ active: true, url: url });
    return false;
  };

  Popup.methods.updateTabContent = function() {
    var $this = $(this),
      $tabContainer = $this.parents('.tabContainer'),
      targetContainerId = $this.attr('data-targetId');

    $tabContainer.find('.selected').removeClass('selected');
    $this.addClass('selected');

    $('.se-category').addClass('hidden');
    $('#' + targetContainerId).removeClass('hidden');
  };

  Popup.methods.init();

  // All Event listeners go here
  $('a.link').click(Popup.methods.openQuestionInTab);
  $(document).on('click', '.trash-icon', Popup.methods.removeNotification);
  Popup.vars.$viewNotificationsButton.click(Popup.methods.viewAllNotificationsInTab);
  $('.se-tab').click(Popup.methods.updateTabContent);
});