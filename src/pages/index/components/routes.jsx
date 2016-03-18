var React = require('react');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Main = require('./main.jsx');
var HashHistory = ReactRouter.hashHistory;

var routeConfig = [
  {
    path: '/',
    component: Main
  }
];

module.exports = (
  <Router history={HashHistory} routes={routeConfig} />
);