var React = require('react');
var ReactDOM = require('react-dom');
var BG = chrome.extension.getBackgroundPage();
var ItemStores = BG.SW.stores;

module.exports = React.createClass({
  getInitialState: function() {
    return {
      notifications: ItemStores.userStore
    }
  },

  getDefaultTemplate: function() {
    return <div className="default-template">Start Following awesome users on StackExchange network</div>;
  },

  render: function() {
    var that = this,
      notificationsList = this.state.notifications.map(function(item, index) {
        return that.renderItem(item, index);
      });

    return <ul className="se-list">
      { notificationsList.length > 0 ? notificationsList : this.getDefaultTemplate() }
    </ul>;
  },
  
  renderItem: function(item, index) {
    return <li
      data-objectkey={item.objectKey}
      key={item.objectKey}
      data-objecttype={item.objectType} >
      { this.getNotificationToShow(item, index) }
    </li>
  },

  getNotificationToShow: function(object, rowIndex) {
    var tagsMarkup,
      tagList,
      tags = object.tags,
      flairImageSource = 'http://' + object.domain + '/users/flair/' + object['user_id'] + '.png',
      flairImage,
      userProfileLink;

    if (rowIndex % 2 == 0) {
      flairImageSource += '?theme=dark';
    }

    flairImage = <img src={flairImageSource} alt={object['display_name']} />;
    userProfileLink = <a className="link username" target="_blank" href={object['link']} >{flairImage}</a>;

    tags = tags ? tags.split(',') : [];

    if (tags.length > 0) {
      tagList = tags.map(function(tag, index) {
        if (index < 5) return <span className="tag" key={index}>{tag}</span>
      });

      tagsMarkup = <div className="tag-container">
        <div className="upper-row">
          <span className="verb">likes</span>
        </div>
        <div className="lower-row">{tagList}</div>
      </div>;
    }

    return <div>
      <div className="flair-container left">{userProfileLink}</div>
      {tagsMarkup}
    </div>;
  }
});
