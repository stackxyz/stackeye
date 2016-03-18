var React = require('react');

module.exports = React.createClass({
  render: function() {
    return <div className="se-category pure-menu pure-menu-open pure-menu-horizontal">
      <ul className="tabContainer">
        <li className="pure-menu-selected notification-list-option">
          <a href="#" data-targetid="notification-area" className="se-tab">
            <span>Question Notifications</span>
            <span className="count"></span>
          </a>
        </li>

      </ul>
    </div>;
  }
});


<li className="user-notification-list-option">
  <a href="#" data-targetid="user-notification-area" className="se-tab">User Notifications<span></span></a>
</li>
<li className="question-list-option">
  <a href="#" data-targetid="question-area" className="se-tab">Questions<span></span></a>
  </li>
  <li className="user-list-option">
  <a href="#" data-targetid="users-area" className="se-tab">Users<span></span></a>
  </li>