/**
	#edit_template
		#content_wrapper_header.content_wrapper
			.content_wrapper_title
			.content_box
				.content_field_wrapper
					.content_field_item
						.content_field_content
							span
						.tpl_block_controls
							.tpl_block_drag
							.tpl_block_edit
							.tpl_block_clone
							.tpl_block_delete
			.empty_content_box
*/

var textEditor = CKEDITOR.instances['edit_box_edit_text_editor'];
var boxedTextEditor = CKEDITOR.instances['edit_box_edit_boxedtext_editor'];

var Menu = (function($) {
	function Menu() {
		this.items = [];
	}
	
	Menu.prototype.add = function() {
		this.items.push.apply(this.items, Array.prototype.slice.call(arguments));
	};
	
	Menu.prototype.remove = function(item) {
		var index = this.indexOf(item);
		
		if (index !== -1) {
			this.removeAt(index);
		}
	};
	
	Menu.prototype.removeAt = function(index) {
		this.items.splice(index, 1);
	};
	
	Menu.prototype.indexOf = function(item) {
		return this.items.indexOf(item);
	};
	
	Menu.prototype.each = function(callback) {
		this.items.forEach(callback);
	};
	
	Menu.prototype.callEach = function(callback) {
		this.items.forEach(function(item) {
			callback.call(item);
		});
	};
	
	Menu.prototype.selectors = function() {
		Array.prototype.slice.call(arguments).forEach(function(arg) {
			this.add(this.create($(arg)));
		}, this);
	};
	
	Menu.prototype.prepare = function(initiator, selector) {
		var self = this;
		
		if (typeof selector === 'string') {
			initiator.click(this.show.bind(this, this.create($(selector))));
		} else { // selector should be function
			initiator.click(function() {
				self.show(self.create(selector.call(this)));
			});
		}
	};
	
	Menu.prototype.create = function(node) {
		return new MenuItem(node);
	};
	
	Menu.prototype.show = function(node) {
		this.callEach(MenuItem.prototype.hide);
		node.show();
	};
	
	Menu.prototype.hide = function() {
		this.callEach(MenuItem.prototype.show);
		node.hide();
	};
	
	function MenuItem(node, fixed) {
		this.node = node;
		this.fixed = !!fixed;
	}
	
	MenuItem.prototype.show = function() {
		if (!this.fixed) this.node.show(0);
	};
	
	MenuItem.prototype.hide = function() {
		if (!this.fixed) this.node.hide(0);
	};
	
	return Menu;
}(jQuery));

var menu = new Menu();

menu.selectors(
	'.edit_box_submenu',
	'#edit_box_design',
	'#edit_box_menu_content',
	'.subsub_menu'
);

menu.prepare($('#edit_box_showcontent'), '#edit_box_menu_content');
menu.prepare($('.design_editor_back'), '#edit_box_design');
menu.prepare($('#edit_box_showdesign'), '#edit_box_design');
menu.prepare($('.edit_editor_back'), '#edit_box_menu_content');
menu.prepare($('.edit_box_design_cancel'), '#edit_box_menu_content');
menu.prepare($('.edit_box_edit_cancel'), '#edit_box_menu_content');
menu.prepare($('.design_editor_open'), function() {
	return $('#edit_box_design_' + $(this).data('open'));
});
menu.prepare($('.subsubmenu_button'), function() {
	var buttons = $(this).parents('.subsubmenu_button_group').find('.subsubmenu_button');
	var index = buttons.index(this);
	var target = $(this).parents('.submenu_wrapper').find('.subsub_menu').eq(index);
	
	buttons.removeClass('active');
	$(this).addClass('active');
	
	return target.add(target.parents());
});

var app = (function(window, $, _) {
	var doc = window.document;
	
	var ghost = $('<div id="drop_block_Ghost" class="entry_index"><div class="drop_block_hint"><span>Drop content here</span></div></div>');
	ghost.css('margin', '5px 15px');
	ghost.eq(0)[0].addEventListener('dragover', function(e) {
		e.preventDefault();
	});
	
	function Storage() {
		var data = {};
		
		this.get = function(key) {
			return _.hasOwn.call(data, key) ? data[key] : null;
		};
		
		this.set = function(key, value) {
			data[key] = value;
		};
	}
	
	var _data = new Storage();
	var styleNode = doc.createElement('style');
	var sheet = doc.body.appendChild(styleNode).sheet;
	
	var showBorder = { border: '2px solid #808080' };
	var highlightBorder = { border: '2px solid #abcdef' };
	var hideBorder = { border: '2px solid rgba(0, 0, 0, 0)' };
	
	function App() {
		this.wrapper = $('#edit_template');
		this.styleBox = this.wrapper;
		this.entries = [];
		this.containers = {};
		this.selected = null;
		this.style = {};
		this.childrenStyle = {};
		
		['*', 'h1']
		.concat(_.keys(this.types).map(function(key) { return '.' + key + '_entry'; }))
		.forEach(function(key) {
			this.childrenStyle[key] = {
				rule: sheet.cssRules[sheet.insertRule('#edit_template .content_field_content ' + key + ' {}', sheet.cssRules.length)],
				style: {}
			};
		}, this);
		
		this.editChildren('*', {
			margin: 0
		});
		
		_.assign(this.style, {});
		
		['Preheader', 'Header', 'Body', 'Footer'].forEach(function(title) {
			var key = title.toLowerCase();
			this.containers[key] = new Container(key, title);
			this.wrapper.append(this.containers[key].wrapper);
		}, this);
	};
	
	App.prototype.getEntry = function(id) {
		var i = 0,
			il = this.entries.length,
			entry;
		
		for (; i < il; i++) {
			if ((entry = this.entries[i]).id === id) return entry;
		}
		
		return null;
	};
	
	App.prototype.add = function(entry, pos) {
		this.addAt(entry, this.entries.length, pos);
	};
	
	App.prototype.addAt = function(entry, index, pos) {
		this.entries.splice(index, 0, entry);
		entry.container.add(entry.wrapper, pos);
	};
	
	App.prototype.remove = function(entry) {
		var index = this.indexOf(entry);
		
		if (index !== -1) {
			this.removeAt(index);
		}
	};
	
	App.prototype.removeAt = function(index) {
		var entry = this.entries[index];
		
		if (entry) {
			this.entries.splice(index, 1);
			entry.container.remove(entry.wrapper);
		}
	};
	
	App.prototype.move = function(entry, container, pos) {
		// todo detach would be better
		entry.container.remove(entry.wrapper);
		entry.container = this.containers[container];
		entry.container.add(entry.wrapper, pos);
		entry.initEvents();
	};
	
	App.prototype.indexOf = function(entry) {
		return this.entries.indexOf(entry);
	};
	
	App.prototype.each = function(callback) {
		this.entries.forEach(callback);
	};
	
	App.prototype.orderedEach = function(callback) {
		var self = this;
		var i, j;
		
		i = 0;
		
		_.forIn(this.containers, function(key, container) {
			j = 0;
			
			container.getChildren().each(function() {
				var entry = self.getEntry($(this).attr('id'));
				if (entry !== null) callback(entry, i++, j++, key);
			});
		});
	};
	
	App.prototype.create = function(type, containerKey) {
		if (!_.hasOwn.call(this.types, type)) {
			// the given type does not exists
			throw new Error('type "' + type + '"' + ' does not exists');
		}
		
		if (!_.hasOwn.call(this.containers, containerKey)) {
			// the given container does not exists
			throw new Error('container "' + containerKey + '"' + 'does not exists');
		}
		
		return new this.types[type](this, this.containers[containerKey]);
	};
	
	App.prototype.editEntry = function(data) {
		if (this.selected === null) return void 0;
		
		this.selected.edit(data);
		this.selected.refresh();
	};
	
	App.prototype.focus = function(entry) {
		this.selected = entry;
	};
	
	App.prototype.blur = function() {
		this.selected = null;
	};
	
	App.prototype.edit = function(style) {
		_.assign(this.style, style);
	};
	
	App.prototype.editChildren = function(nodeType, style) {
		var childStyle = this.childrenStyle[nodeType]; // todo handle invalid nodeType
		_.assign(childStyle.style, style);
	};
	
	App.prototype.refresh = function() {
		this.styleBox.css(this.style);
		
		_.values(this.childrenStyle).forEach(function(childStyle) {
			_.assign(childStyle.rule.style, childStyle.style);
		}, this);
	};
	
	App.prototype.types = {
		text: TextEntry,
		boxedtext: BoxedTextEntry,
		divider: DividerEntry,
		image: ImageEntry,
		button: ButtonEntry,
		footer: FooterEntry,
		code: CodeEntry
	};
	
	// todo
	App.prototype.getData = function() {
		var ret = {};
		ret.style = this.style;
		_.forIn(this.containers, function(key, value) {
			ret[key] = {
				style: value.style,
				entries: []
			};
		});
		
		this.orderedEach(function(entry) {
			ret[entry.container.id].entries.push({
				type: entry.type,
				config: entry.getConfig()
			});
		});
		
		return JSON.stringify(ret);
	};

	// todo
	App.prototype.setData = function(data) {
		// todo fuckin' ckeditor \n
		data = data.replace(/\n/gm, '<br>');
		data = JSON.parse(data);
		
		this.style = data.style;
		
		_.keys(this.containers).forEach(function(key) {
			var containerData = data[key];
			
			containerData.entries.forEach(function(entryData) {
				var entry = this.create(entryData.type, key);
				
				entry.setConfig(entryData.config);
				entry.refresh();
				
				this.add(entry);
			}, this);
			
			this.containers[key].style = containerData.style;
			this.containers[key].refresh();
		}, this);
		
		this.refresh();
	};
	
	function Container(id, title) {
		var wrapper = $('<div id="content_wrapper_' + id + '" class="content_wrapper"></div>');
		var wrapperTitle = $('<div class="content_wrapper_title">' + title + '</div>');
		var contentBox = $('<div class="content_box"></div>');
		var container = $('<div class="content_field_wrapper"></div>');
		var emptyBox = $('<div class="empty_content_box">Drop content here</div>');
		
		this.id = id;
		this.title = title;
		
		this.style = {};
		this.childrenStyle = {};
		
		['*', 'a'].forEach(function(key) {
			this.childrenStyle[key] = {
				rule: sheet.cssRules[sheet.insertRule('#content_wrapper_' + id + ' .content_field_content ' + key + ' {}', sheet.cssRules.length)],
				style: {}
			};
		}, this);
		
		contentBox.append(container);
		wrapper.append(wrapperTitle, container, emptyBox);
		
		wrapper.css('margin', '18px 0');
		
		this.wrapper = wrapper;
		this.container = container;
		this.styleBox = this.container;
		
		wrapper[0].addEventListener('dragover', function(e) {
			e.preventDefault();

			$('.content_wrapper').css(showBorder);
			$(this).css(highlightBorder);
			
			$('.content_wrapper_title').css('background', '#999');
			$(this).children('.content_wrapper_title').css('background', '#abcdef');
		});
		
		wrapper[0].addEventListener('dragleave', function(e) {
			$('.content_wrapper_title').css('background', '#999');
			$('.content_wrapper').css(showBorder);
		});
		
		wrapper[0].addEventListener('drop', function(e) {
			e.preventDefault();
			
			if (_data.get('method') === 'add') {
				var entry = app.create(_data.get('type'), id);
				app.add(entry, _data.get('index'));
			} else if (_data.get('method') === 'move') {
				app.move(_data.get('entry'), id, _data.get('index'));
			}
		});
		
		emptyBox[0].addEventListener('dragover', function(e) {
			e.preventDefault();
			ghost.remove();
		});
	}
	
	Container.prototype.add = function(item, index) {
		var reference = this.container.children('.content_field_item').eq(index);
		this.wrapper.addClass('has_items');
		
		if (index === undefined || reference.size() === 0) {
			this.container.append(item);
		} else {
			reference.before(item);
		}
	};
	
	Container.prototype.remove = function(item) {
		item.remove();
		
		if (this.container.children().size() === 0) {
			this.wrapper.removeClass('has_items');
		}
	};
	
	Container.prototype.getChildren = function() {
		return this.container.children();
	};
	
	Container.prototype.edit = function(style) {
		_.assign(this.style, style);
	};
	
	Container.prototype.editChildren = App.prototype.editChildren;
	
	Container.prototype.refresh = App.prototype.refresh;
	
	function Entry(parent, container) {
		this.id = 'entry_' + _.id(8);
		
		this.style = {};
		this.styleRule = sheet.cssRules[sheet.insertRule('#' + this.id + ' .content_field_content * {}', sheet.cssRules.length)];
		this.parentStyle = {};
		this.data = {};
		
		this.parent = parent;
		this.container = container;
		this.wrapper = $('<div id="' + this.id + '" class="content_field_item entry_index"></div>');
		this.content = $('<div class="content_field_content"></div>');
		
		this.dragButton = $('<span class="tpl_block_drag"><i class="glyphicon glyphicon-th"></i></span>');
		this.editButton = $('<span class="tpl_block_edit"><i class="glyphicon glyphicon-edit"></i></span>');
		this.cloneButton = $('<span class="tpl_block_clone"><i class="glyphicon glyphicon-duplicate"></i></span>');
		this.deleteButton = $('<span class="tpl_block_delete"><i class="glyphicon glyphicon-remove"></i></span>');
		this.controls = $('<div class="tpl_block_controls"></div>').hide();
		
		this.controls.append(this.dragButton, this.editButton, this.cloneButton, this.deleteButton);
		this.wrapper.append(this.content, this.controls);
	};
	
	Entry.prototype.parent = null;
	Entry.prototype.type = null;
	Entry.prototype.container = null;
	
	Entry.prototype.getContent = function() {
		return this.content.html();
	};
	
	Entry.prototype.setContent = function(content) {
		this.content.append(this.elem);
		this.wrapper.off();
		this.wrapper.find('*').off();
		this.initEvents();
	};
	
	Entry.prototype.edit = function(data) {
		_.forIn(data, function(key, value) {
			_.assign(this[key], value);
		}, this);
	};
	
	Entry.prototype.refresh = function() {
		_.callIf(this.customRefresh, this);
		_.assign(this.styleRule.style, this.style);
		this.content.css(this.parentStyle);
	};
	
	Entry.prototype.initEvents = function() {
		var self = this;

		self.wrapper.hover(self.controls.show.bind(self.controls, 0), self.controls.hide.bind(self.controls, 0));
		self.wrapper[0].addEventListener('dragover', function(e) {
			var target = e.target;
			var dragged = _data.get('entry');
			
			// if over itself then return
			if (dragged === self) return void 0;
			
			var ifBefore = target.offsetTop + target.offsetHeight / 2 > e.layerY;
			var index = $(this).index('#' + self.container.wrapper.attr('id') + ' .content_field_item') + (ifBefore ? 0 : 1);
			
			if (dragged !== null && dragged.wrapper.index('#' + dragged.container.wrapper.attr('id') + ' .content_field_item') < index) index -= 1;
			
			_data.set('index', index);
			
			ghost['insert' + (ifBefore ? 'Before' : 'After')]($(this));
			
			// index faq
			if (dragged !== null && dragged.container.id !== self.container.id) {
				_data.set('index', ghost.index('#' + self.container.wrapper.attr('id') + ' .entry_index'));
			}
		});
		
		self.dragButton[0].draggable = true;
		
		self.dragButton[0].addEventListener('dragstart', function(e) {
			e.dataTransfer.setData('Text', 'For firefox');
			
			_data.set('type', self.type);
			_data.set('method', 'move');
			_data.set('entry', self);
			
			$('.content_wrapper_title').show();
			$('.content_wrapper').css(showBorder);
		});
		
		self.dragButton[0].addEventListener('dragend', function(e) {
			$('.content_wrapper_title').hide();
			$('.content_wrapper_title').css('background', '#999');
			$('.content_wrapper').css(hideBorder);
			
			ghost.remove();
		});
		
		menu.prepare(self.editButton, function() {
			var wrapperBox = $('#edit_box_edit_' + self.type);
			
			self.parent.focus(self);
			if (self instanceof TextEntry) self.editor.setData(self.getContent());
			
			wrapperBox.find('.subsubmenu_button').removeClass('active');
			wrapperBox.find('.subsubmenu_button').eq(0).addClass('active');
			
			return wrapperBox.add(wrapperBox.find('.subsub_menu').eq(0));
		});
		
		self.cloneButton.click(function() {
			self.parent.add(self.clone(), self.wrapper.index('#' + self.container.wrapper.attr('id') + ' .content_field_item') + 1);
		});
		
		self.deleteButton.click(function() {
            self.parent.remove(self);
		});
	};
	
	Entry.prototype.getConfig = function() {
		return _.getProps(this, ['data', 'style', 'parentStyle']);
	};
	
	Entry.prototype.setConfig = function(config) {
		_.forIn(config, function(key, value) {
			_.assign(this[key], value);
		}, this);
	};
	
	Entry.prototype.clone = function() {
		var entry = this.parent.create(this.type, this.container.id);
		
		entry.setConfig(this.getConfig());
		entry.refresh();
		
		return entry;
	};
	
	function TextEntry(app, container) {
		Entry.call(this, app, container);
		
		this.elem = $('<div></div>');
		this.col1 = $('<div></div>');
		this.col2 = $('<div>Aenean malesuada, eros eu fringilla pharetra, nulla arcu lobortis leo.</div>');
		this.elem.append(this.col1, this.col2);
		
		$(this.col1).add(this.col2).css('vertical-align', 'top');
		
		this.data = {
			active: 0,
			multiCols: 0,
			columnsSize: 0,
			ratios: [[100, 0], [50, 50], [25, 75], [75, 25]]
		};
		
		this.init();
		this.setContent(this.elem);
		this.refresh();
	}
	
	TextEntry.prototype = Object.create(Entry.prototype);
	TextEntry.prototype.constructor = TextEntry;
	TextEntry.prototype.init = function() {
		this.type = 'text';
		this.wrapper.addClass('text_entry');
		this.editor = textEditor;
	};
	TextEntry.prototype.customRefresh = function() {
		var active = +this.data['active'] === 0 ? this.col1 : this.col2;
		active.html(this.editor.getData());
		
		var ratio = this.data.ratios[+this.data.multiCols ? this.data.columnsSize : 0];
		this.col1.css('width', ratio[0] + '%').css('display', 'inline-block');
		this.col2.css('width', ratio[1] + '%').css('display', +this.data.multiCols ? 'inline-block' : 'none');
	};
	TextEntry.prototype.getContent = function() {
		return (+this.data['active'] === 0 ? this.col1 : this.col2).html();
	};
	
	function BoxedTextEntry(app, container) {
		TextEntry.call(this, app, container);
		this.parentStyle.padding = '18px';
		this.parentStyle.background = '#EBEBEB';
		this.refresh();
	}
	
	BoxedTextEntry.prototype = Object.create(TextEntry.prototype);
	BoxedTextEntry.prototype.constructor = BoxedTextEntry;
	BoxedTextEntry.prototype.init = function() {
		this.type = 'boxedtext';
		this.wrapper.addClass('boxedtext_entry');
		this.editor = boxedTextEditor;
	};
	
	function DividerEntry(app, container) {
		Entry.call(this, app, container);
		
		this.type = 'divider';
		this.elem = $('<hr>');
		
		this.wrapper.addClass('divider_entry');
		
		this.setContent(this.elem);
		this.refresh();
	}
	
	DividerEntry.prototype = Object.create(Entry.prototype);
	DividerEntry.prototype.constructor = DividerEntry;
	
	function ImageEntry(app, container) {
		Entry.call(this, app, container);
		
		this.type = 'image';
		this.data.src = 'images/cicákok.gif';
		this.data.edgetoedge = false;
		this.elem = $('<img src="">');
		
		this.wrapper.addClass('image_entry');

		this.setContent(this.elem);
		this.refresh();
	}
	
	ImageEntry.prototype = Object.create(Entry.prototype);
	ImageEntry.prototype.constructor = ImageEntry;
	ImageEntry.prototype.customRefresh = function() {
		this.parentStyle.padding = this.data.edgetoedge ? '0px' : '7px 18px';
		this.elem.attr('src', this.data.src);
	};
	
	// todo link
	function ButtonEntry(app, container) {
		Entry.call(this, app, container);
		
		this.type = 'button';
		this.elem = $('<button type="button"></button>');
		this.data.text = 'button';
		
		_.assign(this.style, {
			textAlign: 'center',
			background: "#909090",
			borderColor: "#707070",
			borderRadius: "5px",
			borderStyle: "solid",
			borderWidth: "2px",
			color: "#ffffff",
			fontFamily: "arial",
			fontSize: "16px",
			fontWeight: "bold",
			letterSpacing: "0px",
			padding: "16px",
			textAlign: "center",
			width: "auto"
		});
		
		_.assign(this.parentStyle, {
			textAlign: 'center'
		});
		
		this.wrapper.addClass('button_entry');
		
		this.setContent(this.elem);
		this.refresh();
	}
	
	ButtonEntry.prototype = Object.create(Entry.prototype);
	ButtonEntry.prototype.constructor = ButtonEntry;
	ButtonEntry.prototype.customRefresh = function() {
		this.elem.html(this.data.text);
	};
	
	function FooterEntry(app, container) {
		Entry.call(this, app, container);
		
		this.type = 'footer';
		this.elem = $('<div></div>');
		this.data.text = 'footer.';
		
		this.wrapper.addClass('footer_entry');
		
		this.setContent(this.elem);
		this.refresh();
	}
	
	FooterEntry.prototype = Object.create(Entry.prototype);
	FooterEntry.prototype.constructor = FooterEntry;
	FooterEntry.prototype.customRefresh = function() {
		this.elem.html(this.data.text);
	};
	
	function CodeEntry(app, container) {
		Entry.call(this, app, container);
		
		this.type = 'code';
		this.elem = $('<div></div>');
		this.data.text = '<a href="#">link</a>';
		
		this.wrapper.addClass('code_entry');
		
		this.setContent(this.elem);
		this.refresh();
	}
	
	CodeEntry.prototype = Object.create(Entry.prototype);
	CodeEntry.prototype.constructor = CodeEntry;
	CodeEntry.prototype.customRefresh = function() {
		this.elem.html(this.data.text);
	};
	
	$('#blocks_container li div').each(function() {
		this.draggable = true;
		
		this.addEventListener('dragstart', function(e) {
			e.dataTransfer.setData('Text', 'For firefox');
			
			_data.set('type', $(this).data('template'));
			_data.set('method', 'add');
			_data.set('entry', null);
			
			$('.content_wrapper_title').show();
			$('.content_wrapper').css(showBorder);
		});
		
		this.addEventListener('dragend', function(e) {
			$('.content_wrapper_title').hide();
			$('.content_wrapper_title').css('background', '#999');
			$('.content_wrapper').css(hideBorder);
			
			ghost.remove();
		});
	});
	
	return new App();
}(this, jQuery, (function() {
	var _ = {};
	
	var objProto = Object.prototype
		, hasOwn = objProto.hasOwnProperty
		, arrProto = Array.prototype
		, slice = arrProto.slice
	;
	
	_.id = function(len) {
		var id = '';
		
		while (len--) id += (Math.random() * 10 | 0);
		
		return id;
	};
	
	_.forIn = function(obj, callback, thisArg) {
		thisArg = thisArg || obj;
		
		this.keys(obj).forEach(function(key) {
			callback.call(thisArg, key, obj[key]);
		});
	};
	
	_.keys = Object.keys;
	
	_.values = function(obj) {
		var ret = [];
		
		this.keys(obj).forEach(function(key) {
			ret.push(obj[key]);
		});
		
		return ret;
	};
	
	_.assign = function(target, data) {
		this.forIn(data, function(key, value) {
			target[key] = value;
		});
		
		return target;
	};
	
	_.getProps = function(obj, keys) {
		var ret = {};
		
		keys.forEach(function(key) {
			ret[key] = obj[key];
		});
		
		return ret;
	};
	
	_.setEachProp = function(obj, props, val) {
		var propList = slice.call(props);
		var setter = typeof val === 'function' ? val : this.toFunction(val);
		
		propList.forEach(function(prop) {
			obj[prop] = setter(prop);
		});
	};
	
	_.addDefaultProp = function(obj, key) {
		if (!_.hasOwn.call(obj, key)) obj[key] = {};
		
		return obj;
	};
	
	_.toFunction = function(val) {
		return function() { return val; }
	};
	
	_.isCallable = function(obj) {
		return typeof obj === 'function';
	};
	
	_.callIf = function(obj, thisArg) {
		var args;
		
		if (this.isCallable(obj)) {
			obj.apply(thisArg, slice.call(arguments).slice(2));
		}
	};
	
	_.slice = slice;
	
	_.hasOwn = hasOwn;
	
	return _;
}())));

$('.bootstrapdropdown').each(function() {
	var self = $(this);
	
	self.find('ul.dropdown-menu li').click(function() {
		self.find('.bootstrapdropdownval').val($(this).data('dropval')).trigger('change');
		self.find('.dropdown_val').html($(this).data('droptitle') || $(this).data('dropval'));
	});
});

$('.bootstrapswitch').each(function() {
	var self = $(this);
	var list = self.find('.bootstrapswitchlist li');
	
	list.click(function() {
		self.find('.bootstrapswitchval').val($(this).data('switchval')).trigger('change');
		list.removeClass('active');
		
		$(this).addClass('active');
	});
});

$('.bootstrapselect').each(function() {
	var self = $(this);
	
	self.find('button').click(function() {
		self.find('.bootstrapselectval').val($(this).data('selectval')).trigger('change');
		self.find('button').removeClass('active');
		
		$(this).addClass('active');
	});
});

$('.bootstrapcolor').change(function() {
	$(this).siblings('.color_input').val($(this).val()).trigger('change');
});

$('.bootstrapremovewrapper').each(function() {
	var self = $(this);
	var removeButton = self.find('.bootstrapremove');
	var removeAble = self.find('.bootstrapremoveable');
	
	removeButton.click(function() {
		removeAble.val('');
		removeButton.hide();
	});
	
	removeAble.on('change', function() {
		removeButton.show();
	});
});

$('.edit_editor_back, .edit_box_edit_cancel').click(app.blur);

$('#design_page_editor_save').click(function() {
	['h1'].forEach(function(header) {
		app.editChildren(header, setStyle('.design_box_edit_page_' + header + '_style'));
	});
	
	app.edit(setStyle('.design_box_edit_page_style'));
	app.refresh();
}).trigger('click');

$('.design_container_editor').each(function() {
	var self = $(this);
	var container = app.containers[$(this).data('containerkey')];
	
	self.find('.design_container_editor_save').click(function() {
		container.edit(setStyle('#edit_box_design_' + container.id + ' .design_box_edit_container_style'));
		
		self.find('.design_box_edit_container_children_style').each(function() {
			var data = {};
			
			data[$(this).data('optionkey')] = $(this).val() + ($(this).data('optionunit') || '');
			container.editChildren($(this).data('selector'), data);
		});
		
		container.refresh();
	}).trigger('click');
});

$('.savestyle').click(function() {
	var key = $(this).data('savestyle');
	var data = {};
	
	data.style = setStyle('.edit_box_edit_' + key + '_style');
	data.parentStyle = setStyle('.edit_box_edit_' + key + '_parent_style');
	data.data = setStyle('.edit_box_edit_' + key + '_data');
	
	app.editEntry(data);
});

$('#edit_text_focus').change(function() {
	if (app.selected && app.selected.type === 'text') {
		app.selected.data.active = $(this).val();
		textEditor.setData(app.selected.getContent());
	}
});
$('#edit_boxedtext_focus').change(function() {
	if (app.selected && app.selected.type === 'boxedtext') {
		app.selected.data.active = $(this).val();
		boxedTextEditor.setData(app.selected.getContent());
	}
});

function setStyle(selector, obj) {
	obj = obj || {};
	
	getStyle(selector, function(key, value) {
		obj[key] = value;
	});
	
	return obj;
}

function getStyle(selector, callback) {
	$(selector).each(function() {
		callback(
			$(this).data('optionkey'),
			$(this).attr('type') === 'checkbox' ? $(this).is(':checked') : ($(this).val() + ($(this).data('optionunit') || ''))
		);
	});
}
