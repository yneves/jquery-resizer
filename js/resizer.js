/*!
**  jquery-resizer -- jQuery plugin to make siblings resizable within their parent.
**  Copyright (c) 2014 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/jquery-resizer>
*/
(function($) {
// - -------------------------------------------------------------------- - //

$.fn._resizerMapObjs = function() {
	var arr = [];
	this.each(function() {
		arr.push($(this));
	});
	return arr;
};

// - -------------------------------------------------------------------- - //

// .resizer()
$.fn.resizer = function(arg) {
	var args = arguments;
	return this.each(function() {

		var elm = $(this);
		var namespace = "resizer";
		var opts = elm.data(namespace);

		// already initialized
		if (opts) {

			if (arg == "minimize") {

				var prop = opts.mode == "horizontal" ? "width" : "height";

				elm.children(opts.selector).filter(args[1]).each(function() {
					var item = $(this);
					var size = parseInt(item.css(prop));
					var min = parseInt(item.css("min-" + prop));
					var delta = size - min;
					item.css(prop,min);
					var prev = item.prevAll(opts.selector).first();
					if (prev.length > 0) {
						var prevSize = parseInt(prev.css(prop));
						prev.css(prop,prevSize + delta);
					} else {
						var next = item.nextAll(opts.selector).first();
						var nextSize = parseInt(next.css(prop));
						next.css(prop,nextSize + delta);
					}
				});

				elm.trigger("resized");
				elm.trigger("minimized");

				resizeClear();

			}

		// first call
		} else {

			opts = {};
			opts.mode = "vertical";
			opts.selector = ":visible";
			opts.distance = 5;

			if ($.isFunction(arg)) {
				elm.on("resized." + namespace,arg);
			} else if ($.type(arg) == "string") {
				opts.mode = arg.toLowerCase();
			} else if ($.isPlainObject(arg)) {
				if (arg.mode) opts.mode = arg.mode.toLowerCase();
				if (arg.selector) opts.selector = arg.selector;
				if ($.isNumeric(arg.distance)) opts.distance = arg.distance;
				if ($.isNumeric(arg.minHeight)) opts.minHeight = arg.minHeight;
				if ($.isNumeric(arg.minWidth)) opts.minWidth = arg.minWidth;
				if ($.isFunction(arg.start)) elm.on("resizestart." + namespace,arg.start);
				if ($.isFunction(arg.stop)) elm.on("resizestop." + namespace,arg.stop);
				if ($.isFunction(arg.pause)) elm.on("resizepause." + namespace,arg.pause);
				if ($.isFunction(arg.resized)) elm.on("resized." + namespace,arg.resized);
				if ($.isFunction(arg.minimized)) elm.on("minimized." + namespace,arg.minimized);
			}

			if (opts.mode == "v") opts.mode == "vertical";
			if (opts.mode == "h") opts.mode == "horizontal";

			elm.data(namespace,opts).addClass(namespace);

			var horizontal = opts.mode == "horizontal";
			var prop = horizontal ? "width" : "height";
			var cursor = horizontal ? "w-resize" : "s-resize";
			var delay = 100;
			var delayTimeout;
			var paused = false;
			var resizing = false;
			var resizable;
			var lastX;
			var lastY;
			var next;
			var prev;
			var total;
			var mins = [];
			var items = [];
			var itemspos = [];

			// @resizeUp
			function resizeUp(resize) {
				var used = 0;
				// shrinks all the previous elements
				for (var i = 0; i < prev.length; i++) {
					var size = parseInt(prev[i].css(prop)) - resize;
					var min = mins[i];
					if (size > min) {
						used += size;
						prev[i].css(prop,size);
						break;
					} else {
						used += min;
						prev[i].css(prop,min);
						// pause resizing if first element reach minimum height
						paused = (i == prev.length - 1);
					}
				}
				// expands the immediate next element
				for (var i = next.length - 1; i >= 0; i--) {
					var size = parseInt(next[i].css(prop));
					if (i == 0) {
						size = Math.min(size + resize,total - used);
						next[i].css(prop,size);
					} else {
						used += size;
					}
				}
			}

			// @resizeDown
			function resizeDown(resize) {
				var used = 0;
				// shrinks all the next elements
				for (var i = 0; i < next.length; i++) {
					var size = parseInt(next[i].css(prop)) - resize;
					var min = mins[i];
					if (size > min) {
						used += size;
						next[i].css(prop,size);
						break;
					} else {
						used += min;
						next[i].css(prop,min);
						// pause resizing if last element reach minimum size
						paused = (i == next.length - 1);
					}
				}
				// expands the immediate previous element
				for (var i = prev.length - 1; i >= 0; i--) {
					var size = parseInt(prev[i].css(prop));
					if (i == 0) {
						size = Math.min(size + resize,total - used);
						prev[i].css(prop,size);
					} else {
						used += size;
					}
				}
			}

			// @resizeStart
			function resizeStart(ev) {
				resizing = true;
				lastY = ev.pageY;
				lastX = ev.pageX;
				mins = items.map(function(e) { return parseInt(e.css("min-" + prop)) });
				total = parseInt(elm.css(prop));
				next = resizable.nextAll(opts.selector)._resizerMapObjs();
				prev = resizable.prevAll(opts.selector)._resizerMapObjs();
				next.unshift(resizable);
				elm.trigger("resizestart");
			}

			// @resizeStop
			function resizeStop() {

				// fills possible empty pixels at the end
				var sizes = [];
				var used = 0;
				for (var i = 0; i < items.length; i++) {
					var size = parseInt(items[i].css(prop));
					if (i == items.length - 1) {
						size = total - used;
						items[i].css(prop,size);
					}
					sizes[i] = size;
					used += size;
				}

				// calculates dimensions as percentages to follow window or parent resizing
				for (var i = 0; i < items.length; i++) {
					var percent = sizes[i] * 100 / total;
					items[i].css(prop,percent.toFixed(2) + "%");
				}

				// clear everything and refresh positions
				resizing = false;
				paused = false;
				total = null;
				lastX = null;
				lastY = null;
				next = null;
				prev = null;
				resizable = null;
				itemspos = items.map(function(e) { return e.offset() });
				elm.css("cursor","");
				elm.trigger("resizestop");
			}

			// @resizeWindow
			function resizeWindow() {
				
				total = parseInt(elm.css(prop));
				
				var sizes = [];
				var used = 0;
				for (var i = 0; i < items.length; i++) {
					var size = parseInt(items[i].css(prop));
					sizes[i] = size;
					used += size;
				}
				
				// if using more space than available cuts from some element
				if (used > total) {
					var resize = used - total;
					for (var i = 0; i < items.length; i++) {
						if (sizes[i] > mins[i]) {
							var available = sizes[i] - mins[i];
							if (available >= resize) {
								sizes[i] = sizes[i] - resize;
								items[i].css(prop,sizes[i] - resize);
								break;
							}
						}
					}

				// if using less space than available distribute among those which aren't minimized
				} else if (used < total) {
					var resize = total - used;
					for (var i = 0; i < items.length; i++) {
						if (sizes[i] > mins[i]) {
							sizes[i] = sizes[i] + resize;
							items[i].css(prop,sizes[i] + resize);
							break;
						}
					}

				}

				// calculates dimensions as percentages to follow window or parent resizing
				for (var i = 0; i < items.length; i++) {
					var percent = sizes[i] * 100 / total;
					items[i].css(prop,percent.toFixed(2) + "%");
				}

				total = null;
			}

// - -------------------------------------------------------------------- - //

			// @window-resize
			$(window).on("resize." + namespace,function() {
				delayTimeout && clearTimeout(delayTimeout);
				delayTimeout = setTimeout(resizeWindow,delay);
			});

			// @mouse-enter
			elm.on("mouseenter." + namespace,function(ev) {
				items = elm.children(opts.selector)._resizerMapObjs();
				itemspos = items.map(function(e) { return e.offset() });
			});

			// @mouse-leave
			elm.on("mouseleave." + namespace,function(ev) {
				// stops resizing if mouse leaves area
				if (resizing) {
					elm.trigger("mouseup." + namespace);
				}
			});

			// @mouse-up
			elm.on("mouseup." + namespace,function(ev) {
				// if it was resizing then stops on mouse release
				if (resizing) {
					resizeStop();
				}
			});

			// @mouse-down
			elm.on("mousedown." + namespace,function(ev) {
				// if mouse is over the resizing area then starts resizing
				if (resizable) {
					resizeStart(ev);
				}
			});

			// @mouse-move
			elm.on("mousemove." + namespace,function(ev) {

				if (resizing) {

					if (paused) {

						// restore cursor if mouse left the resizing area of the element
						var pos = resizable.offset();
						var over = horizontal
							? ev.pageX > pos.left - opts.distance && ev.pageX < pos.left + opts.distance
							: ev.pageY > pos.top - opts.distance && ev.pageY < pos.top + opts.distance;
						if (over) {
							paused = false;
						}

					} else {

						if (horizontal) {
							// mouse moving left
							if (ev.pageX < lastX) {
								resizeUp(lastX - ev.pageX);
							// mouse moving right
							} else if (ev.pageX > lastX) {
								resizeDown(ev.pageX - lastX);
							}
						} else {
							// mouse moving up
							if (ev.pageY < lastY) {
								resizeUp(lastY - ev.pageY);
							// mouse moving down
							} else if (ev.pageY > lastY) {
								resizeDown(ev.pageY - lastY);
							}
						}

						if (paused) {
							elm.trigger("resizepause");
						} else {
							elm.trigger("resized");
						}

					}

					lastY = ev.pageY;
					lastX = ev.pageX;

				} else if (resizable) {

					// restore cursor if mouse left the resizing area of the element
					var pos = resizable.offset();
					var over = horizontal
						? ev.pageX > pos.left - opts.distance && ev.pageX < pos.left + opts.distance
						: ev.pageY > pos.top - opts.distance && ev.pageY < pos.top + opts.distance;
					if (!over) {
						elm.css("cursor","");
						resizable = null;
					}

				} else {

					if (horizontal) {

						// change cursor if mouse is over the resizing area of an element
						for (var i = 1; i < items.length; i++) {
							var pos = itemspos[i];
							var overX = ev.pageX > pos.left - opts.distance && ev.pageX < pos.left + opts.distance;
							if (overX) {
								elm.css("cursor",cursor);
								resizable = items[i];
								break;
							}
						}

					} else {

						// change cursor if mouse is over the resizing area of an element
						for (var i = 1; i < items.length; i++) {
							var pos = itemspos[i];
							var overY = ev.pageY > pos.top - opts.distance && ev.pageY < pos.top + opts.distance;
							if (overY) {
								elm.css("cursor",cursor);
								resizable = items[i];
								break;
							}
						}

					}

				}

			});

		}

	});
};

// - -------------------------------------------------------------------- - //
})(window.jQuery);