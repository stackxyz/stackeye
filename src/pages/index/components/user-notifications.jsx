var React = require('react');
var ReactDOM = require('react-dom');
var BG = chrome.extension.getBackgroundPage();
var ItemStores = BG.SW.stores;

module.exports = React.createClass({
  getInitialState: function() {
    return {
      notifications: ItemStores.userNotificationStore
    }
  },

  getDefaultTemplate: function() {
    return <div className="default-template">Start Following awesome users on StackExchange network</div>;
  },

  render: function() {
    var that = this,
      notificationsList = this.state.notifications.map(function(item) {
      return that.renderItem(item);
    });

    return <ul className="se-list">
      { notificationsList.length > 0 ? notificationsList : this.getDefaultTemplate() }
    </ul>;
  },
  
  renderItem: function(item) {
    return <li
      data-objectkey={item.objectKey}
      key={item.objectKey}
      data-objecttype={item.objectType} >
      { this.getNotificationToShow(item) }
    </li>
  },

  getNotificationToShow: function(userNotificationItem) {
    var text,
      owner = userNotificationItem.owner,
      postType = userNotificationItem['post_type'],
      userProfileLink = <a className="profile-link username" href={owner['link']}>{owner['display_name']}</a>;

    if (postType == 'question') {
      text = <span>{userProfileLink} has asked a question</span>;
    }

    if (postType == 'answer') {
      text = <span>{userProfileLink} answered on</span>;
    }

    return <div>
      <div className="avatar-container left">
        <img src={owner['profile_image']} />
      </div>
      <div className="right content-container">
        <div className="upper-row">{text}</div>
        <div className="lower-row">
          <a className="link" target="_blank" href={userNotificationItem.link}>{userNotificationItem.title}</a>
        </div>
      </div>

      <i className="fa fa-trash-o fa-fw display-none trash-icon" title="Delete Notification" />
    </div>;
  }

});
