window.SW = window.SW || {};
SW.methods = SW.methods || {};
SW.vars = SW.vars || {};
SW.stores = SW.stores || {};
SW.callbacks = SW.callbacks || {};
SW.modes = SW.modes || {};
SW.constants = SW.constants || {};

/*-----------------------------------------------------------*/
SW.vars.isUrlValid = false;
SW.vars.activeTabUrl = '';

SW.vars.ALLOWED_PAGES = [
  'stackoverflow.com/questions/',
  'stackexchange.com/questions/'
];

SW.modes.inDebugMode = false;

// Conversion to seconds
SW.vars.TIME = {
  T_2_MIN   : 60*2,
  T_5_MIN   : 60*5, 
  T_15_MIN  : 60*15,
  T_30_MIN  : 60*30,
  T_1_HOUR  : 60*60,
  T_2_HOUR  : 60*60*2,
  T_5_HOUR  : 60*60*5,
  T_1_DAY   : 60*60*24,
  T_2_DAY   : 60*60*24*2,
  T_5_DAY   : 60*60*24*5
};

// SW.vars.FETCH_NOTIFICATION_TIME = SW.vars.TIME.T_30_MIN * 1000;
SW.vars.FETCH_NOTIFICATION_TIME =  SW.vars.TIME.T_5_MIN * 1000; //setinterval takes time in miliseconds

SW.messages = {
  WARN_INVALID_URL: 'Please navigate to a stackoverflow question page',

  ERROR_UNABLE_TO_GET_URL_CURRENT_TAB: 'Unable to get the url of current tab.Please file a bug',
  ERROR_FETCH_ANSWER_LIST: 'Error in fetching answer list',
  ERROR_FETCH_COMMENT_LIST: 'Error in fetching comment list',
  ERROR_FETCH_QUESTION_DATA: 'Error in fetching question data',

  INFO_DATA_SAVED: 'Question has been added to watch list'
};

SW.constants = {
  ACCEPTED_ANSWER: 'accepted_answer',
  NEW_COMMENT: 'comment',
  ANSWER: 'answer'
};
