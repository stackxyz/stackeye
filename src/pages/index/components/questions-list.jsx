var React = require('react');
var ReactDOM = require('react-dom');
var BG = chrome.extension.getBackgroundPage();
var ItemStores = BG.SW.stores;

module.exports = React.createClass({
  getInitialState: function() {
    return {
      notifications: ItemStores.questionFeedStore
    }
  },

  getDefaultTemplate: function() {
    return <div className="default-template">Too Bad!! You are not watching any question</div>;
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

  getNotificationToShow: function(questionObject) {
    return <div className="lower-row">
      <img src={"https://www.google.com/s2/favicons?domain=" + questionObject.domain} />
      <a className="link" target="_blank" href={questionObject.link}>{questionObject.title}</a>
    </div>;
  }
});
