var BG = chrome.extension.getBackgroundPage();
var Popup = {};
Popup.methods = {};
Popup.vars = {};

Popup.vars.busyWatching = false;
Popup.vars.$watchButton = $('#swo_watch_button');
Popup.vars.$watchingButton = $('#swo_watching_button');

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

Popup.methods.init = function() {
  BG.SW.methods.isPagebeingWatched(Popup.methods.watchSuccess)
};

Popup.vars.$watchButton.click(Popup.methods.watchCurrentPage);

Popup.methods.init();