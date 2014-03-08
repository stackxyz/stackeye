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

  NP.methods.getUserMarkup = function(object, rowIndex) {
    var markup,
      tags = object.tags,
      flairImageSource = 'http://' + object.domain + '/users/flair/' + object['user_id'] + '.png',
      flairImage,
      userProfileLink;

    if (rowIndex % 2 == 0) {
      flairImageSource += '?theme=dark';
    }

    flairImage = '<img src="' + flairImageSource + '" alt="' + object['display_name'] + '" />';
    userProfileLink = '<a class="link username" target="_blank" href="' + object['link'] + '">' + flairImage + '</a>';

    if (tags) {
      tags = tags.split(',');
    } else {
      tags = [];
    }

    markup = '<div class="flair-container left">' + userProfileLink + '</div>';
    markup += '<div class="tag-container">';
    if (tags.length > 0) markup += '<div class="upper-row"><span class="verb">likes</span></div>';
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
      var object = itemList[i];
      if (object) {
        notificationToShow = getMarkupMethod(object, i);
        $('<li></li>').attr('data-objectKey', object.objectKey)
          .html(notificationToShow).appendTo($list);
      }
    }

    if (notificationListLength) {
      $listContainer.html($list.html());
    }
  };

  NP.methods.updateDeleteButton = function($button, selectedItemsLength) {
    $button.attr('disabled', (selectedItemsLength == 0));
  };

  NP.methods.removeSelectedItems = function() {
    var $list = $(this).parents('.category-area').find('.se-list'),
      $selectedItems = $list.find('li.se-selected'),
      message = $(this).attr('data-message'),
      objectType = $(this).attr('data-objectType'),
      store = BG.SW.maps.ObjectTypeToStoreMap[objectType];

    if (window.confirm(message)) {
      $selectedItems.each(function(index, selectedItem) {
        var objectKey = selectedItem.getAttribute('data-objectKey');
        BG.SW.methods.removeObjectFromStore(objectKey, store);
        BG.SW.methods.deleteObject(objectKey);
        BG.SW.methods.updateBadgeText();
        $(selectedItem).remove();
      });
    }

    NP.methods.updateDeleteButton($(this), $list.find('li.se-selected').length);
    NP.methods.updateItemsCount();
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

  NP.methods.updateItemsCount = function() {
    // Show the number along side with tab names like Questions[3] and Users[5]
    $('.se-category').find('a').each(function(index, tab) {
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

    NP.methods.updateItemsCount();
  };

  NP.methods.init();
  $('.se-tab').click(NP.methods.showTab);
  $('.deleter').click(NP.methods.removeSelectedItems);
});