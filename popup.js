var BG = chrome.extension.getBackgroundPage();
var Popup = {};
Popup.methods = {};
Popup.vars = {};

Popup.vars.busyWatching = false;
Popup.vars.$watchButton = $('#swo_watch_button');
Popup.vars.$watchingButton = $('#swo_watching_button');
Popup.vars.$notificationCountButton = $('#notification-count');
Popup.vars.notifications = BG.SW.stores.notificationStore;

Popup.methods.watchSuccess = function(message) {
  Popup.vars.$watchButton.hide();
  Popup.vars.$watchingButton.show();

  // Show message somewhere on popup
  if (message) alert(message);
};

Popup.methods.watchCurrentPage = function() {
  if (!Popup.vars.busyWatching) {
    Popup.vars.busyWatching = true;
    BG.SW.methods.startWatchingActiveTabPage(Popup.methods.watchSuccess);
    Popup.vars.busyWatching = false;
  }
};

Popup.methods.setNotificationCount = function() {
  var num_notifications = Popup.vars.notifications.length;

  if (num_notifications > 99) {
    num_notifications = '100+';
  }

  Popup.vars.$notificationCountButton.text(num_notifications);
};

Popup.methods.updateCurrentPage = function() {
  Popup.methods.setNotificationCount();
};

Popup.methods.init = function() {
  BG.SW.methods.isPagebeingWatched(Popup.methods.watchSuccess);
  Popup.methods.updateCurrentPage();
};

Popup.methods.init();

// All Event listeners go here
Popup.vars.$watchButton.click(Popup.methods.watchCurrentPage);