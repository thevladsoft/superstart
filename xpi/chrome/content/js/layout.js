"use strict";
var layout = (function() {
	const MINWIDTH = 960;
	const NOTEWIDTH = 200;
	const SITE_MIN_WIDTH_IN_COMPACTMODE = 208;
	const ratio = 0.5625;//0.625; // 0.5625 => 16:9, 0.625 => 16:10

	function LayoutParameter(width, col) {
		var compact = cfg.getConfig('sites-compact');
		this.width = width;
		this.startY = 20;
		if (compact) {
			this.xPadding = 20;
			this.yPadding = 5;
			if (cfg.getConfig('sites-text-only')) {
				this.yPadding = 15;
			}

			var w = Math.floor(width * 2 / 3);
			this.siteWidth = Math.floor((w - (col - 1) * this.xPadding) / col);
			if (this.siteWidth > SITE_MIN_WIDTH_IN_COMPACTMODE) {
				this.siteWidth = SITE_MIN_WIDTH_IN_COMPACTMODE;
			}
			this.startX = Math.floor((width - this.siteWidth * col - (col - 1) * this.xPadding) / 2);
		} else {
			this.xPadding = 30;
			this.yPadding = 20;
			this.siteWidth = Math.floor((width - (col - 1) * this.xPadding) / (col + 1));
			this.startX = Math.floor(this.siteWidth / 2);
		}
		this.siteHeight = 0; // get it in runtime
		this.snapshotWidth = this.siteWidth;
		this.snapshotHeight = Math.floor(this.snapshotWidth * ratio);
	}
	var lp0 = new LayoutParameter(MINWIDTH, 1);
	var lp1 = new LayoutParameter(MINWIDTH, 1);

	function calcLayout() {
		var w = window.innerWidth;//document.body.clientWidth;
		if (w < MINWIDTH) {
			w = MINWIDTH;
		}
		if (!cfg.getConfig('todo-hide')) {
			w -= NOTEWIDTH;
		}
		var col = cfg.getConfig('col');
		lp0 = new LayoutParameter(w, col);

		col = getFolderColumn();
		lp1 = new LayoutParameter(w, col);

		var notes = $$('notes');
		notes.style.marginRight = Math.floor(lp0.startX / 4) + 'px';
	}

	// -- register events begin ---
	var cfgevts = {
		'col': onColChanged,
		'sites-compact': onSitesCompactChanged,
		'sites-text-only': onSitesTextOnly,
		'todo-hide': onTodoHide
	};
	var wevts = {
		'resize': onResize
	};
	evtMgr.register([cfgevts], [wevts], []);
	evtMgr.ready(function() {
		checkTextOnly();
		calcLayout();
		document.body.style.minWidth = MINWIDTH + 'px';
	});
	// -- register events ended ---

	function onResize() {
		calcLayout();

		var ss = $$('sites');
		$.addClass(ss, 'notransition');
		layout.layoutTopSites(true);

		if($('.folder.opened').length == 1) {
			layout.layoutFolderArea();
		}

		window.setTimeout(function() {
			$.removeClass(ss, 'notransition');
		}, 0);
	}

	function onColChanged(evt, v) {
		calcLayout();
		layoutTopSites();
		if($('.folder.opened').length == 1) {
			layout.layoutFolderArea();
		}
	}

	function onSitesCompactChanged(evt, v) {
		calcLayout();
		layoutTopSites();
		if($('.folder.opened').length == 1) {
			layout.layoutFolderArea();
		}
	}

	function onSitesTextOnly(evt, v) {
		checkTextOnly();
		calcLayout();
		layoutTopSites();
		if($('.folder.opened').length == 1) {
			layout.layoutFolderArea();
		}
	}

	function checkTextOnly() {
		var only = cfg.getConfig('sites-text-only');
		var nsps = [
			{'site': '', 'folder': '', 'placeholder': ''},
			{'site': '.site-snapshot', 'folder': '.site-snapshot', 'placeholder': '.site-snapshot'},
			{'site': '.site-title', 'folder': '.site-title', 'placeholder': '.site-title'},
			{'site': '.site-title-image', 'folder': '.site-title-image'},
			{'site': '.button', 'folder': '.button', 'placeholder': '.button'}
		];
		var sels = [
			'.site',
			'.site-snapshot',
			'.site-title',
			'.site-title-image',
			'.button'
		];
		for (var i = 0; i < nsps.length; ++ i) {
			tmplMgr.changeElementsClass(nsps[i], sels[i], only ? 'add' : 'remove', 'text-only');
		};
	}

	function onTodoHide(evt, v) {
		calcLayout();
		layoutTopSites();
		if($('.folder.opened').length == 1) {
			layout.layoutFolderArea();
		}
	}

	function getFolderColumn() {
		var col = cfg.getConfig('col');
		return col;// + 1;
	}

	// 3 items per line
	// 3 items per column
	// < w > <  3w  > < w > <  3w  > < w > <  3w  > < w >
	function layoutFolderElement(se) {
		// setTopSiteSize(se);
		var sn = $(se, '.site-snapshot')[0];

		var cw = sn.clientWidth;
		if (cw == 0) {
			cw = parseInt(sn.style.width);
		}
		var ch = sn.clientHeight;
		if (ch == 0) {
			ch = parseInt(sn.style.height);
		}
		var w = cw / 13;
		var h = ch / 13;
		var ww = Math.ceil(w * 3);
		var hh = Math.ceil(h * 3);
		var mh = Math.ceil((ch - 3 * hh) / 4);
		w = Math.floor(w);
		h = Math.floor(h);
		
		var imgs = sn.getElementsByTagName('img');
		var x = w;
		var y = mh;
		for (var i = 0; i < imgs.length;) {
			var img = imgs[i];
			img.style.left = x + 'px';
			img.style.top = y + 'px';
			img.style.width = ww + 'px';
			img.style.height = hh + 'px';
			x += ww + w;

			++ i;
			if (i % 3 == 0) {
				x = w;
				y += hh + mh;
			}

		}
	}

	function placeSitesInFolderArea() {
		var ses = $('#folder > .site');
		var x = lp1.startX;
		var y = lp1.startY;
		var w = lp1.siteWidth;
		var h = Math.floor(w * ratio);

		var col = getFolderColumn();
		return placeSites(ses, col, lp1);
	}

	function layoutFolderArea() { 
		var folder = $$('folder');
		if (folder == null) {
			return;
		}

		var ses = $(folder, '.site');

		var height = placeSitesInFolderArea();

		var se = $('.folder.opened');
		se = se[0];
		var top = $.getPosition(se).top + parseInt(se.style.height);

		folder.style.height = height + 'px';
		folder.style.top = top + 'px';

		// move below sites
		var ses = $('#sites > .site');
		for (var i = 0, l = ses.length; i < l; ++ i) {
			var s = ses[i];
			if (s.offsetTop > se.offsetTop) {
				var top = parseInt(s.style.top);
				top += height;
				s.style.top = top + 'px';
			}
		}
	}

	function setTopSiteSize(se) {
		se.style.width = lp0.siteWidth + 'px';
		se.style.height = lp0.siteHeight + 'px';

		var sn = $(se, '.site-snapshot')[0];
		sn.style.width = lp0.snapshotWidth + 'px';
		sn.style.height = lp0.snapshotHeight + 'px';
	}

	// return the height of the container, used by the #folder
	function placeSites(ses, col, lp) {
		var textOnly = cfg.getConfig('sites-text-only');
		var height = 0;
		var l = ses.length;
		if (l > 0) {
			if (lp.siteHeight == 0) {
				var ch = $(ses[0], '.site-title')[0].offsetHeight;
				if (textOnly) {
					lp.siteHeight = ch;
				} else {
					lp.siteHeight = lp.snapshotHeight + ch;
				}
			}

			var nw = lp.snapshotWidth + 'px';
			var nh = lp.snapshotHeight + 'px';
			if (textOnly) {
				nh = '0px';
			}
			var sw = lp.siteWidth + 'px';
			var sh = lp.siteHeight + 'px';
			var x = lp.startX, y = lp.startY;
			for (var i = 0, l = ses.length; i < l;) {
				var se = ses[i];
				if (!$.hasClass(se, 'dragging')) {
					se.style.width = sw;
					se.style.height = sh;
					var sn = $(se, '.site-snapshot')[0];
					sn.style.width = nw;
					sn.style.height = nh;

					var top = y + 'px';
					var left = x + 'px';
					se.style.top = top;
					se.style.left = left;
					// se.style.transform = 'translate(' + left + ', ' + top + ')';
				}

				x += lp.siteWidth + lp.xPadding;
				++ i;
				if (i % col == 0 && i < l) {
					x = lp.startX;
					y += lp.siteHeight + lp.yPadding;
				}
			}
			height = y + lp.siteHeight + lp.yPadding;
		}
		return height;
	}

	function layoutFolderElements() {
		var fs = $('#sites > .folder');
		for (var i = 0; i < fs.length; ++ i) {
			var f = fs[i];
			if (!$.hasClass(f, 'dragging')) {
				layoutFolderElement(f);
			}
		}
	}

	function layoutTopSites() {
		var ses = $('#sites > .site');
		var col = cfg.getConfig('col');

		placeSites(ses, col, lp0);
		layoutFolderElements();
	}

	function onSnapshotTransitionEnd(e) {
		if (e.propertyName != 'width') {
			return;
		}
		var se = this.parentNode;
		while (se && !$.hasClass(se, 'site')) {
			se = se.parentNode;
		}
		if (se && $.hasClass(se, 'folder')) {
			layoutFolderElement(se);
		}
	}


	var actID = null;
var layout = {
	layoutTopSites: function(actingNow) {
		if (actingNow) {
			if (actID) {
				window.clearTimeout(actID);
				actID = null;
			}
			layoutTopSites();
		} else {
			if (actID == null) {
				actID = window.setTimeout(function(){
					actID = null;
					layoutTopSites();
				}, 0);
			}
		}
	},

	'layoutFolderArea': layoutFolderArea
	, 'placeSitesInFolderArea': placeSitesInFolderArea
	, 'layoutFolderElement': layoutFolderElement
	, 'setTopSiteSize': setTopSiteSize

	// 'onSiteResize': onSiteResize
	// Maybe I can use MutationObserver to mointor the resizing event!!
	// https://developer.mozilla.org/en-US/docs/DOM/MutationObserver
	, 'onSnapshotTransitionEnd': onSnapshotTransitionEnd
	
}; // layout
	return layout;
}());
