var React = require('react');
var TabHeader = require('./tab-header.jsx');
var BG = chrome.extension.getBackgroundPage();
var ItemStores = BG.SW.stores;

module.exports = React.createClass({
  render: function() {
    return <div>
      <TabHeader stores={ItemStores} />
      {this.content()}
    </div>
  },

  content: function() {
    if (this.props.children) {
      return this.props.children
    } else {
      // return <TopicList />
      return <div>
        We will render more content here later!! Please stay tuned
      </div>
    }
  }
});