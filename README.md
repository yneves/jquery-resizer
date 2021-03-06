jquery-resizer
==============

jQuery plugin to make siblings resizable within their parent.

This is not about resizing a floating element, like a popup or something. It's about resizing on siblings within their parent, like flex boxes. When resizing, if element reaches its minimum dimension then the resizing moves to the next element and so on. Also, it does not append anything to your DOM to act as a handler, instead, mouse position is checked against edges. The goal is to feature a fully resizable UI.

## Usage

Load the script after jQuery.

```html
<script src="js/jquery-2.1.0.js"></script>
<script src="js/resizer.js"></script>
```

Markup is very simple.

```html
<div id="resizable">
	<div></div>
	<div></div>
	<div></div>
	<div></div>
	<div></div>
</div>
```

Initial and minimum dimensions should be styled.

```html
<style>
#resizable { height: 600px; } /* or width */
#resizable > div { height: 20%; min-height: 30px; } /* or min-width */
</style>
```

Start the plugin.

```html
<script>
$("#resizable").resizer("vertical"); // or horizontal
</script>
```

Listen to events.

```js
// fired when resize operation starts (mousedown on resize area)
$("#resizable").on("resizestart");

// fired when resize operation stops (mouseup/mouseleave)
$("#resizable").on("resizestop");

// fired when all elements reach minimum size
$("#resizable").on("resizepause");

// fired during the resize operation
$("#resizable").on("resized");
```
