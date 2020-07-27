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

      AnalyticsHelper.trackEvent(
        objectType,
        SW.TRACKING_INFO.ACTIONS.DELETED,
        objectType + ' deleted from settings page',
        $selectedItems.length   
      );
    }

    NP.methods.updateDeleteButton($(this), $list.find('li.se-selected').length);
    NP.methods.updateItemsCount();
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
    NP.methods.updateItemsCount();
  };

  NP.methods.showTab = function(event) {
    var el = event.currentTarget,
      targetId = el.getAttribute('data-targetId');

    $('.tabContainer').find('li').removeClass('pure-menu-selected');
    $(el).parent('li').addClass('pure-menu-selected');

    $('.category-area').hide();
    $('#' + targetId).show();

    AnalyticsHelper.trackTabChangedOnNotificationsPage(targetId, $(el).find('span').html());

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

      $(tab).find('span').html(numItems.toString());
    });
  };

  // TODO change to chrome.storage.sync in future (https://github.com/sachinjain024/stackeye/issues/33)
  const sharedStorage = chrome.storage.local;

  /**
   * @param obj {Object}
   * @param predicate {(s: string) => boolean}
   */
  // https://stackoverflow.com/a/48294085/14379
  const filterByKey = (obj, predicate) =>
    Object.keys(obj)
      .filter(key => predicate(key))
      .reduce((acc, k) => {
        acc[k] = obj[k];
        return acc;
      }, {});

  /** @param key {string} */
  const sharedStorageKey = key => key.startsWith('question:') || key.startsWith('user:');

  /** @param key {String} */
  const notificationKeyFilter = key => key.indexOf('notification') > -1;

  NP.methods.exportData = function() {
    sharedStorage.get(null, items => {
      const itemsToExport = filterByKey(items, sharedStorageKey);
      const json = JSON.stringify(itemsToExport, null, 2);
      const mediaType = 'application/json';
      const blob = new Blob([json], { type: mediaType });

      // Trigger Click on anchor element so file starts downloading
      const a = window.document.createElement('a');
      a.download = `stackeye-export-${Shared.methods.getCurrentDate()}.json`;
      a.href = URL.createObjectURL(blob);
      a.click();
    });

    AnalyticsHelper.trackEvent(
      SW.TRACKING_INFO.CATEGORIES.SETTINGS,
      SW.TRACKING_INFO.ACTIONS.EXPORTED,
      'All data exported'
    );
  };

  NP.methods.importData = function() {
    const input = window.document.createElement('input');
    input.setAttribute('type', 'file');
    input.addEventListener('change', _ev => {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = ev => {
        /** @type {string} */
        const json = (reader.result);
        const obj = JSON.parse(json);
        const itemsToImport = filterByKey(obj, sharedStorageKey);
        if (!jQuery.isEmptyObject(itemsToImport)) {
          sharedStorage.set(itemsToImport, () => {
            const err = chrome.runtime.lastError;
            if (err) {
              console.log(err)
            } else {
              // Reload the new information in all stores
              BG.SW.methods.createStores();
              alert(`Imported ${Object.keys(itemsToImport).length} objects successfully!`);
              window.location.reload();
            }
          });
        }
      };
      reader.readAsText(file);
    });
    input.click();

    AnalyticsHelper.trackEvent(
      SW.TRACKING_INFO.CATEGORIES.SETTINGS,
      SW.TRACKING_INFO.ACTIONS.IMPORTED,
      'All data imported'
    );
  };

  NP.methods.deleteAllQuestionsAndUsers = function() {
    const message = $(this).attr('data-message');

    if (window.confirm(message)) {
      // Don't just call clear, in case storage contains other types of data
      sharedStorage.get(null, items => {
        const keysToDelete = Object.keys(items).filter(sharedStorageKey);
        if (keysToDelete.length !== 0) {
          sharedStorage.remove(keysToDelete, () => {
            const err = chrome.runtime.lastError;
            if (err) {
              console.log(err);
            } else {
              BG.SW.methods.createStores();
              alert(`Deleted ${keysToDelete.length} items.`);
              window.location.reload();
            }
          });
        }
      });
    }
  };

  NP.methods.deleteAllNotifications = function() {
    const message = $(this).attr('data-message');

    if (window.confirm(message)) {
      // Don't just call clear, in case storage contains other types of data
      sharedStorage.get(null, items => {
        const keysToDelete = Object.keys(items).filter(notificationKeyFilter);
        if (keysToDelete.length !== 0) {
          sharedStorage.remove(keysToDelete, () => {
            const err = chrome.runtime.lastError;
            if (err) {
              console.log(err);
            } else {
              BG.SW.methods.createStores();
              alert(`Deleted ${keysToDelete.length} items.`);
              window.location.reload();
            }
          });
        }
      });
    }
  };

  NP.methods.init = function() {
    Shared.methods.renderItems(
      NP.vars.notifications,
      NP.vars.$notificationList,
      Shared.methods.getNotificationToShow,
      Shared.DEFAULT_TEMPLATES.QUESTION_NOTIFICATION
    );

    Shared.methods.renderItems(
      NP.vars.userNotifications,
      NP.vars.$userNotificationList,
      Shared.methods.getUserNotificationMarkup,
      Shared.DEFAULT_TEMPLATES.USER_NOTIFICATION
    );

    Shared.methods.renderItems(
      NP.vars.questions,
      NP.vars.$questionList,
      NP.methods.getQuestionMarkup,
      Shared.DEFAULT_TEMPLATES.QUESTION
    );

    Shared.methods.renderItems(
      NP.vars.users,
      NP.vars.$userList,
      NP.methods.getUserMarkup,
      Shared.DEFAULT_TEMPLATES.USER
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
  $('a.link').click(NP.methods.removeNotificationItem);
  $('#data-export').click(NP.methods.exportData);
  $('#data-import').click(NP.methods.importData);
  $('#questions-users-clear-button').click(NP.methods.deleteAllQuestionsAndUsers);
  $('#notifications-clear-button').click(NP.methods.deleteAllNotifications);

  AnalyticsHelper.enableDataAttributesTracking();
});
