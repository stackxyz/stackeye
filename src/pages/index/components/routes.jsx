var React = require('react');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Main = require('./main.jsx');
var HashHistory = ReactRouter.hashHistory;

var QuestionNotifications = require('./question-notifications.jsx');
var UserNotifications = require('./user-notifications.jsx');
var QuestionsList = require('./questions-list.jsx');
var UsersList = require('./users-list.jsx');

var routeConfig = [
  {
    path: '/',
    component: Main,
    indexRoute: {
      onEnter: function (nextState, replace) {
        replace('/questions/notifications');
      }
    },
    childRoutes: [
      { path: 'questions/notifications', component: QuestionNotifications },
      { path: 'users/notifications', component: UserNotifications },
      { path: 'questions/list', component: QuestionsList },
      { path: 'users/list', component: UsersList }
    ]
  }
];

module.exports = (
  <Router history={HashHistory} routes={routeConfig} />
);