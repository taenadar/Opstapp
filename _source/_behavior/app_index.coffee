# Store scope; probably `window`.
exports = @

# "Polyfill" `console.error` calls.
exports.console or exports.console = {}
exports.console.log or exports.console.log = ->

# Store the slice method in `Array.prototype`.
__slice__ = Array::slice

# Select All.
$ = exports.$ = ( selectors ) ->
	$nodes = new $.NodeList
	context = if @querySelector then @ else document
	$nodes_ = context.querySelectorAll selectors

	length = $nodes_.length
	iterator = -1

	while ++iterator < length
		$nodes[ iterator ] = $nodes_[ iterator ]
		$nodes.length++

	$nodes

# Select one item.
$$ = exports.$$ = ( selectors, index ) ->
	$nodes = $ selectors
	$nodes.item index

# NodeList Contstructor.
$.NodeList = ->

# NodeList Prototype, inherit from Array.
$.NodeList:: = Object.create Array::

# Get one item.
$.NodeList::item = ( index ) ->
	@[ index or 0 ] or null

# Default `length`.
$.NodeList::length = 0

# Select all inside a selection.
$.NodeList::$ = ( selectors ) -> 
	$nodes = new $.NodeList
	length = @length
	iterator = -1
	
	while ++iterator < length
		$nodes_ = @[ iterator ].$ selectors
		iterator_ = -1
		length_ = $nodes_.length

		while ++iterator_ < length_
			$nodes.push $nodes_[ iterator_ ]

	$nodes

# Select one item inside a selection.
$.NodeList::$$ = ( selectors, index ) ->
	$nodes = @$ selectors
	$nodes.item index

# Return a new NodeList containing the same items as `this`.
$.NodeList::clone = ->
	$nodes = new $.NodeList
	length = @length
	iterator = -1

	while ++iterator < length
		$nodes.push @[ iterator ]
	
	$nodes

# NodeList inherits from Array, but `Array::concat` can't concatenate 
# Array-like objects. Here we overwrite concat to make concatenating two 
# NodeList possible.

$.NodeList::concat = ->
	$nodes = do @clone

	arguments_ = __slice__.call arguments
	
	context = if @querySelector then @ else document

	length = arguments_.length
	iterator = -1

	while ++iterator < length
		argument = arguments_[ iterator ]

		if argument instanceof $.NodeList or argument instanceof NodeList
			length_ = argument.length
			iterator_ = -1

			while ++iterator_ < length_
				$nodes.push argument[ iterator_ ]
		else
			$nodes.push argument
	
	$nodes

# Call `on` for each item in the selection.
$.NodeList::on = ( type, listener ) ->
	
	length = @length
	iterator = -1

	while ++iterator < length
		@[ iterator ].on type, listener
	
	@

# Macro to `querySelectorAll` and `querySelector`.
Element::$ = Element::querySelectorAll
Element::$$ = Element::querySelector

# Macro to `addEventListener`.
Window::on = Window::addEventListener
Element::on = Element::addEventListener

# Detect if a CSS property is supported, and under which prefix.
$div = document.createElement 'div'
vendors = 'Khtml Ms O Moz Webkit'.split ' '
vendorsLength = vendors.length

exports.supports = supports = ( prop ) ->
	iterator = vendorsLength
	
	if prop of $div.style then return prop
	
	prop = prop.replace /^[a-z]/, ( value ) ->
		return do value.toUpperCase
	
	if prop of $div.style then return prop
	
	while iterator--
		prop_ = vendors[ iterator ] + prop
		
		if prop_ of $div.style then return prop_
		
		prop__ = ( do vendors[ iterator ].toLowerCase ) + prop
		
		if prop__ of $div.style then return prop__
	
	false

