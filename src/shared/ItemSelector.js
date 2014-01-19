function ListItemSelector(options) {
  if (!options.el) {
    console.error('Please provide the list selector');
    return null;
  }

  this.singleSelectMode = true;
  if (options.multiSelectMode) {
    this.singleSelectMode = false;
  }

  this.$el = $(options.el);
  this.itemSelector = options.itemSelector || 'li';
  this.$items = this.$el.find(this.itemSelector);
  this.selectedItemClassName = options.selectedItemClassName || 'lis-selected';
  this.activeItemClassName = options.activeItemClassName || 'lis-active';

  this.bindEvents(this.$items);
  return this;
}

ListItemSelector.prototype.bindEvents = function($listItems) {
  $listItems.mouseover(this.makeItemActive.bind(this));
  $listItems.mouseout(this.makeItemInactive.bind(this));
  $listItems.click(this.selectItem.bind(this));
};

ListItemSelector.prototype.makeItemActive = function(event) {
  var $element = $(event.currentTarget);
  $element.addClass(this.activeItemClassName);
};

ListItemSelector.prototype.makeItemInactive = function(event) {
  var $element = $(event.currentTarget);
  $element.removeClass(this.activeItemClassName);
};

ListItemSelector.prototype.selectItem = function(event) {
  var $element = $(event.currentTarget);

  if (this.singleSelectMode) {
    this.$items.removeClass(this.selectedItemClassName);
  }
  $element.toggleClass(this.selectedItemClassName);

  $(this).trigger('item:click', { el: $element });
};

ListItemSelector.prototype.getSelectedItems = function() {
  var selectedItems = this.$el.find(this.itemSelector + '.' + this.selectedItemClassName);

  return selectedItems;
};

ListItemSelector.prototype.getAllListItems = function() {
  return this.$items;
};

/*var listSelector = new ListItemSelector({
  singleSelectMode: true,
  el: '#list',
  itemSelector: 'li'
});

listSelector.on('item:click', function(jqEvent, data) {
  alert('clicked on:' + data.el.innerHTML);
});
*/