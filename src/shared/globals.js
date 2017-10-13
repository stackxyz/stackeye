window.SW = window.SW || {};
SW.methods = SW.methods || {};
SW.vars = SW.vars || {};
SW.stores = SW.stores || {};
SW.modes = SW.modes || {};
SW.maps = SW.maps || {};

/*-----------------------------------------------------------*/
SW.vars.ALLOWED_PAGES = [
  'stackoverflow.com/questions/',
  'stackexchange.com/questions/',
  'stackoverflow.com/users/',
  'stackexchange.com/users/'
];

SW.modes.inDebugMode = false;

// Conversion to seconds
SW.vars.TIME = {
  T_2_MIN   : 60*2,
  T_5_MIN   : 60*5,
  T_10_MIN  : 60*10,
  T_15_MIN  : 60*15,
  T_30_MIN  : 60*30,
  T_1_HOUR  : 60*60,
  T_2_HOUR  : 60*60*2,
  T_5_HOUR  : 60*60*5,
  T_6_HOUR  : 60*60*6,
  T_10_HOUR : 60*60*10,
  T_1_DAY   : 60*60*24,
  T_2_DAY   : 60*60*24*2,
  T_5_DAY   : 60*60*24*5,
  T_1_MONTH : 60*60*24*24
};

//setinterval takes time in miliseconds
SW.vars.FETCH_NOTIFICATION_INTERVAL =  SW.vars.TIME.T_5_MIN * 1000;
SW.vars.USER_NOTIFICATION_FETCH_INTERVAL = SW.vars.TIME.T_30_MIN * 1000;

// Maximum number of questions a user can watch
SW.vars.WATCH_QUESTION_LIMIT = 20;

SW.messages = {
  WARN_INVALID_URL: 'Please navigate to a stackoverflow question page',
  WARN_WATCH_LIMIT: 'You can not watch more than 20 Questions',

  CONFIRM_SELECTED_NOTIFICATIONS_DELETE: 'Selected notifications will be removed. Proceed ?',
  CONFIRM_SELECTED_QUESTIONS_DELETE: 'Selected questions will be removed from watchlist. Proceed ?',

  ERROR_UNABLE_TO_GET_URL_CURRENT_TAB: 'Unable to get the url of current tab.Please file a bug',
  ERROR_FETCH_ANSWER_LIST: 'Error in fetching answer list',
  ERROR_FETCH_COMMENT_LIST: 'Error in fetching comment list',
  ERROR_FETCH_QUESTION_DATA: 'Error in fetching question data',

  INFO_DATA_SAVED: 'Question has been added to watch list'
};

SW.constants = {
  ACCEPTED_ANSWER : 'accepted_answer',
  NEW_COMMENT     : 'comment',
  ANSWER          : 'answer',
  URL_ROOT        : 'http://api.stackexchange.com/2.2/',
  APP_KEY         : 'MKhHgtFFPM)vQAp2pvu)fw((',
  VERSION         : '2.3.1'
};

SW.filters = {
  USER_POSTS      : '!)5Us_x-e1YSaW3xeb7fWp3sds7aR',
  USER_DETAILS    : '!)sjb*LbmKJq1r8IglXiR',
  USER_TAGS       : '!9eEm6l210'
};

SW.OBJECT_TYPES = {
  QUESTION: 'question',
  NEW_ACTIVITY_NOTIFICATION: 'question_notification', /*New Answer/Comment on question */
  USER: 'user',
  USER_NOTIFICATION: 'user_notification'
};

SW.stores.questionFeedStore = [];
SW.stores.notificationStore = [];
SW.stores.userStore = [];
SW.stores.userNotificationStore = [];

SW.maps.ObjectTypeToStoreMap = {
  'question': SW.stores.questionFeedStore,
  'question_notification': SW.stores.notificationStore,
  'user': SW.stores.userStore,
  'user_notification': SW.stores.userNotificationStore
};