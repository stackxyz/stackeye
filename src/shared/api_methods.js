SW.methods.getUrlForAllComments = function(idString, domain) {
  // e.g. https://api.stackexchange.com/posts/18829971;18830520;18830230/comments?site=stackoverflow
  return SW.constants.URL_ROOT + 'posts/' + idString + '/comments' +
    '?site=' + domain +
    '&key=' + SW.constants.APP_KEY;
};

SW.methods.getUrlForQuestionUpdates = function(id, domain, lastFetchDate) {
  // https://api.stackexchange.com/questions/19570820/timeline?fromdate =1382486400&site=stackoverflow
  return SW.constants.URL_ROOT + 'questions/' + id + '/timeline' +
    '?fromdate=' + lastFetchDate +
    '&site=' + domain +
    '&key=' + SW.constants.APP_KEY;
};

SW.methods.getUrlForAllAnswers = function(questionId, domain) {
  return SW.constants.URL_ROOT + 'questions/' + questionId + '/answers' +
    '?site=' + domain +
    '&key=' + SW.constants.APP_KEY;
};

SW.methods.getUrlForQuestionData = function(questionId, domain) {
  // https://api.stackexchange.com/questions/18829971?site=stackoverflow
  return SW.constants.URL_ROOT + 'questions/' + questionId +
    '?site=' + domain +
    '&key=' + SW.constants.APP_KEY;
};

SW.methods.getQuestionDataAsync = async function(questionId, domain) {
  var url = SW.methods.getUrlForQuestionData(questionId, domain),
    questionData = {};

  questionData['domain'] = domain;
  questionData['questionId'] = questionId;

  try {
    const response = await $.ajax({
      method: 'GET',
      url: url,
    });
    var qInfo = response.items[0];

    questionData['last_edit_date'] = qInfo.last_edit_date;
    questionData['creation_date'] = qInfo.creation_date;
    questionData['title'] = qInfo.title;
    questionData['link'] = qInfo.link;
    questionData['owner'] = {};
    questionData['owner']['display_name'] = qInfo.owner.display_name;
    questionData['owner']['link'] = qInfo.owner.link;
  } catch (e) {
    console.error(SW.messages.ERROR_FETCH_QUESTION_DATA + ':' + url);
    console.error(JSON.stringify(e));
  }

  return questionData;
};

SW.methods.getAllAnswersAsync = async function(questionId, domain) {
  var url = SW.methods.getUrlForAllAnswers(questionId, domain),
    answerList = [];

  try {
    answerList = (await $.ajax({
      method: 'GET',
      url: url,
    })).items;
  } catch (e) {
    console.error(SW.messages.ERROR_FETCH_ANSWER_LIST + ':' + url);
    console.error(JSON.stringify(e));
  }
  return answerList;
};

SW.methods.getAllAnswerIds = function(answerList) {
  var answerIds = [];

  $.each(answerList, function(index, answerObject) {
    answerIds.push(answerObject.answer_id);
  });

  return answerIds;
};

SW.methods.getAllCommentsAsync = async function (ids, domain) {
  var idString,
    url,
    commentList = [];

  idString = ids.join(';');
  url = SW.methods.getUrlForAllComments(idString, domain);

  try {
    const response = await $.ajax({
      method: 'GET',
      url: url,
    });
    commentList = response.items;
  } catch (e) {
    console.error(SW.messages.ERROR_FETCH_COMMENT_LIST + ':' + url);
    console.error(JSON.stringify(e));
  }
  return commentList;
};

/* https://bitbucket.org/blunderboy/sowatchman/issue/15/timeline-api-not-fetching-comments-when
**Since timeline API is having a bug..I (Sachin Jain) am fetching questionUpdates in a different way
*/

/*
SW.methods.getQuestionUpdatesAsync = async function(id, domain, lastFetchDate) {
  var url = SW.methods.getUrlForQuestionUpdates(id, domain, lastFetchDate),
    questionUpdates = [];

  await $.ajax({
    method: 'GET',
    url: url,
    success: function(response) {
      questionUpdates = response.items;
    },
    error: function(e) {
      console.error(JSON.stringify(e));
    }
  });

  return questionUpdates;
};
*/

SW.methods.filterByCreationDate = function(list, lastFetchDate, timeline_type) {
  var filteredList = [],
    listItem,
    creation_date;

  for (var i = 0; i < list.length; i++) {
    listItem = list[i];
    creation_date = +list[i].creation_date;
    lastFetchDate = +lastFetchDate;

    if (creation_date > lastFetchDate) {
      listItem.timeline_type = timeline_type;
      filteredList.push(listItem);
    }
  }

  return filteredList;
};

SW.methods.getQuestionUpdatesAsync = async function(id, domain, lastFetchDate) {
  var answerList,
    answerIds,
    commentList,
    questionUpdates;

  answerList = await SW.methods.getAllAnswersAsync(id, domain);
  answerIds = SW.methods.getAllAnswerIds(answerList);

  // Add questionId to answerIds as well because we want to get comments on question as well
  answerIds.push(id);

  // Fetch all comments on all answers and on question 
  commentList = await SW.methods.getAllCommentsAsync(answerIds, domain);

  answerList = SW.methods.filterByCreationDate(answerList, lastFetchDate, SW.constants.ANSWER);
  commentList = SW.methods.filterByCreationDate(commentList, lastFetchDate, SW.constants.NEW_COMMENT);

  questionUpdates = answerList.concat(commentList);

  return questionUpdates;
};

/**
 *
 * @param userId
 * Url: http://api.stackexchange.com/docs/posts-on-users#pagesize=10&order=desc&sort=activity&ids=1310070&filter=!)5Us_x-e1YSaW3xeb7fWp3sds7aR&site=stackoverflow&run=true
 * @param domain
 * @param fromDate
 */
SW.methods.getUrlForUserPosts = function(userId, domain, fromDate) {
  var url = SW.constants.URL_ROOT + 'users/' + userId + '/posts';
  url += '?key=' + SW.constants.APP_KEY;
  url += '&site=' + domain;
  url += '&fromDate=' + fromDate;
  url += '&filter=' + SW.filters.USER_POSTS;
  url += '&pagesize=' + 100;

  return url;
};

/**
 *
 * @param userIds Array of userIds
 * @param domain
 * @returns {Promise<Array>}
 * @param fromDate
 */
SW.methods.getUserNotificationsAsync = async function (userIds, domain, fromDate) {
  var idString = userIds.join(';'),
    url = SW.methods.getUrlForUserPosts(idString, domain, fromDate),
    userNotifications = [];

  try {
    const response = await $.ajax({
      method: 'GET',
      url: url,
    });
    userNotifications = response.items;
  } catch (e) {
    console.error(JSON.stringify(e));
  }
  return userNotifications;
};

/**
 *
 * @param userId
 * @returns {string}
 * @param domain
 */
SW.methods.getUrlForUserDetails = function(userId, domain) {
  var url = SW.constants.URL_ROOT + 'users/' + userId;
  url += '?key=' + SW.constants.APP_KEY;
  url += '&site=' + domain;
  url += '&filter=' + SW.filters.USER_DETAILS;

  return url;
};

/**
 *
 * @param userId
 * @param domain
 * @returns {Promise<*>}
 */
SW.methods.getUserDetailsAsync = async function(userId, domain) {
  var url = SW.methods.getUrlForUserDetails(userId, domain);
  var userInfo = null;

  try {
    const response = await $.ajax({
      method: 'GET',
      url: url,
    });
    userInfo = response.items[0];
  } catch (e) {
    console.error(JSON.stringify(e));
  }

  return userInfo;
};

SW.methods.getUrlForUserTags = function(userId, domain) {
  var url = SW.constants.URL_ROOT + 'users/' + userId + '/tags';
  url += '?key=' + SW.constants.APP_KEY;
  url += '&site=' + domain;
  url += '&filter=' + SW.filters.USER_TAGS;
  url += '&pagesize=' + userId.split(';').length * 10; //Fetch 10 tags per user

  return url;
};

SW.methods.fetchUserTagsAsync = async function(userIds, domain) {
  var idString = userIds.join(';'),
    url = SW.methods.getUrlForUserTags(idString, domain),
    userTags = [];

  try {
    const response = await $.ajax({
      method: 'GET',
      url: url,
    });
    userTags = response.items;
  } catch (e) {
    console.error(JSON.stringify(e));
  }

  return userTags;
};
