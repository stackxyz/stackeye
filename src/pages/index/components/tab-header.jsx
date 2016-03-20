var React = require('react');

module.exports = React.createClass({
  render: function() {
    return <div className="se-category pure-menu pure-menu-open pure-menu-horizontal">
      <ul className="tabContainer">
        <li className="pure-menu-selected notification-list-option">
          <a href="#" data-targetid="notification-area" className="se-tab">
            <span>Question Notifications</span>
            <span className="count">{this.props.stores.notificationStore.length}</span>
          </a>
        </li>

        <li className="user-notification-list-option">
          <a href="#" data-targetid="user-notification-area" className="se-tab">
            <span>User Notifications</span>
            <span className="count">{this.props.stores.userNotificationStore.length}</span>
          </a>
        </li>

        <li className="question-list-option">
          <a href="#" data-targetid="question-area" className="se-tab">
            <span>Questions</span>
            <span className="count">{this.props.stores.questionFeedStore.length}</span>
          </a>
        </li>

        <li className="user-list-option">
          <a href="#" data-targetid="users-area" className="se-tab">
            <span>Users</span>
            <span className="count">{this.props.stores.userStore.length}</span>
          </a>
        </li>
      </ul>
    </div>;
  }
});
