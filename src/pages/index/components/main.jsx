var React = require('react');
var TabHeader = require('./tab-header.jsx');

module.exports = React.createClass({
  render: function() {
    return <div>
      <TabHeader />
      <div className="category-area">
        {this.content()}
      </div>
      <button
        id="notification-deleter"
        className="pure-button pure-button-error deleter"
        disabled
        data-message="Are you sure you want to clear selected items ?">
        Clear
      </button>
    </div>
  },

  content: function() {
    return this.props.children
      ? this.props.children
      : <div>Looks like something is wrong!! Please open an issue on Github describing this</div>;
  }
});