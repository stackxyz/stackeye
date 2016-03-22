var React = require('react');
var ReactDOM = require('react-dom');

module.exports = React.createClass({
  getInitialState: function() {
    return {
      notifications: this.props.store
    }
  },

  getDefaultTemplate: function() {
    return <div className="default-template">Hooray!! No Unread Notifications</div>;
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

  getNotificationToShow: function(notificationObject) {
    var text = '',
      markup,
      numAnswers = notificationObject.numAnswers,
      numComments = notificationObject.numComments;

    if (numAnswers != 0 && numComments != 0) {
      text = numAnswers + ' answers and ' + numComments + ' comments ';
    } else if (numAnswers !=0 && numComments == 0) {
      text = numAnswers + ' answers ';
    } else if (numAnswers == 0 && numComments != 0) {
      text = numComments + ' comments ';
    }

    return <div>
      <div className="upper-row">
        <span className="bold">{text}</span>
        <span>on</span>
      </div>
      <div className="lower-row">
        <a className="link" target="_blank" href={notificationObject.link}>{notificationObject.title}</a>
      </div>
      <i className="fa fa-trash-o fa-fw display-none trash-icon" title="Delete Notification" />
    </div>;
  }
});
