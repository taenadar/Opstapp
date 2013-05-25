###
Here be coffee
###

# Store scope; probably `window`.
exports = @

# Store the slice method in Array.prototype.
__slice__ = Array::slice

# Select All.
$ = exports.$ = ( selectors ) ->
	$nodes = new $.NodeList
	$nodes.selectors = selectors
	context = if @querySelector then @ else document
	$nodes_ = context.querySelectorAll selectors

	length = $nodes_.length
	iterator = -1

	while ++iterator < length
		$nodes[ iterator ] = $nodes_[ iterator ]
		$nodes.length++

	$nodes

# Select the first item.

$$ = exports.$$ = ( selectors, index ) ->
	$nodes = $ selectors
	$nodes.item index

# NodeList Contstructor.

$.NodeList = () ->

# NodeList Prototype.

$.NodeList:: = Object.create Array::

$.NodeList::item = ( index ) ->
	@[ index or 0 ] or null

$.NodeList::length = 0
$.NodeList::selector = null

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

$.NodeList::$$ = ( selectors, index ) ->
	$nodes = @$ selectors
	$nodes.item index


$.NodeList::clone = () ->
	$nodes = new $.NodeList
	length = @length
	iterator = -1

	while ++iterator < length
		$nodes.push @[ iterator ]
	
	$nodes


$.NodeList::concat = () ->
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

Element::$ = Element::querySelectorAll
Element::$$ = Element::querySelector

Window::on = Window::addEventListener
Element::on = Element::addEventListener

$div = document.createElement 'div'
vendors = 'Khtml Ms O Moz Webkit'.split ' '
vendorsLength = vendors.length

exports.supports = supports = ( prop ) ->
	iterator = vendorsLength
	
	prop = prop.replace /^[a-z]/, ( value ) ->
		return do value.toUpperCase
	
	if prop of $div.style
		return prop
	
	while iterator--
		prop_ = vendors[ iterator ] + prop
		
		if prop_ of $div.style then return prop_
		
		prop__ = ( do vendors[ iterator ].toLowerCase ) + prop
		
		if prop__ of $div.style then return prop__
	
	false

