var React = require('react');
var ReactRouter = require('react-router');
var Link = ReactRouter.Link;
var BG = chrome.extension.getBackgroundPage();
var ItemStores = BG.SW.stores;

module.exports = React.createClass({
  getInitialState: function() {
    return {
      stores: ItemStores
    }
  },

  render: function() {
    return <div className="se-category pure-menu pure-menu-open pure-menu-horizontal">
      <ul className="tabContainer">
        <li className="pure-menu-selected notification-list-option">
          <Link to="/questions/notifications" className="se-tab">
            <span>Question Notifications</span>
            <span className="count">{this.state.stores.notificationStore.length}</span>
          </Link>
        </li>

        <li className="user-notification-list-option">
          <Link to="/users/notifications" className="se-tab">
            <span>User Notifications</span>
            <span className="count">{this.state.stores.userNotificationStore.length}</span>
          </Link>
        </li>

        <li className="question-list-option">
          <Link to="/questions/list" data-targetid="question-area" className="se-tab">
            <span>Questions</span>
            <span className="count">{this.state.stores.questionFeedStore.length}</span>
          </Link>
        </li>

        <li className="user-list-option">
          <Link to="/users/list" data-targetid="users-area" className="se-tab">
            <span>Users</span>
            <span className="count">{this.state.stores.userStore.length}</span>
          </Link>
        </li>
      </ul>
    </div>;
  }
});
