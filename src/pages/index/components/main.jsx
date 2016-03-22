var React = require('react');
var TabHeader = require('./tab-header.jsx');
var BG = chrome.extension.getBackgroundPage();
var ItemStores = BG.SW.stores;
var QuestionNotifications = require('./question-notifications.jsx');

module.exports = React.createClass({
  render: function() {
    return <div>
      <TabHeader stores={ItemStores} />
      <div className="category-area">
        {this.content()}
      </div>
    </div>
  },

  content: function() {
    return this.props.children
      ? this.props.children
      : <QuestionNotifications store={BG.SW.stores.notificationStore} />;
  }
});