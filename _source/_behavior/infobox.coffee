exports = @

###
An InfoBox is like an info window, but it displays
under the marker, opens quicker, and has flexible styling.
@param {GLatLng} latlng Point to place bar at
@param {Map} map The map on which to display this InfoBox.
@param {Object} opts Passes configuration options - content,
	 offsetVertical, offsetHorizontal, className, height, width
###

InfoBox = ( options ) ->
	google.maps.OverlayView.call @
	@point = options.latlng
	@content = options.content
	
	@height = 150
	@width = 150
	@offsetVertical = -185
	@offsetHorizontal = -25
	
	@


# InfoBox extends GOverlay class from the Google Maps API.
F = ->
F:: = google.maps.OverlayView.prototype;
InfoBox:: = new F

InfoBox::remove = ->
	do @close

# Creates the $node representing this InfoBox.
InfoBox::close = ->
	
	console.log 'close', @, @$node
	
	if @$node
		@$node.parentNode.removeChild @$node
		@$node = null
	
	@setMap null
	
	@

InfoBox::open = ( map ) ->
	# Once the properties of this OverlayView are initialized, set its map so
	# that we can display it. This will trigger calls to panes_changed and
	# draw.
	
	@onboundsChange = google.maps.event.addListener map, 'bounds_changed', =>
		do @panMap
	
	@setMap map
	
	@

# Redraw the Bar based on the current projection and zoom level.
InfoBox::draw = ->
	
	# Creates the element if it doesn't exist already.
	do @createElement
	
	if not @$node then return

	# Calculate the $node coordinates of two opposite corners of our bounds to
	# get the size and position of our Bar.
	pixPosition = @getProjection().fromLatLngToDivPixel @point
	
	if not pixPosition then return

	# Now position our $node based on the $node coordinates of our bounds.
	@$node.style.width = "#{@width}px"
	@$node.style.left = "#{pixPosition.x + @offsetHorizontal}px"
	@$node.style.height = "#{@height}px"
	@$node.style.top = "#{pixPosition.y + @offsetVertical}px"
	@$node.style.display = 'table'

# Creates the $node representing this InfoBox in the floatPane. If the panes
# object, retrieved by calling getPanes, is null, remove the element from the
# DOM.	If the $node exists, but its parent is not the floatPane, move the $node
# to the new pane.
# Called from within draw. Alternatively, this can be called specifically on
# a panes_changed event.
InfoBox::createElement = ->
	panes = do @getPanes
	$node = @$node
	
	if $node
		console.log $node.parentNode, panes.floatPane
	
	if not $node
		console.log 'not node', @, $node
		# This does not handle changing panes. You can set the map to be null 
		# and then reset the map to move the $node.
		$node = @$node = document.createElement 'div'
		$node.style.position = 'absolute'
		$node.style.backgroundColor = 'white'
		$node.style.textAlign = 'center'
		$node.style.boxShadow = '0 0 0 5px rgba(0,0,0,.5)'
		$node.style.textTransform = 'uppercase'
		$node.style.borderRadius = "100%"
		
		$content = document.createElement 'div'
		$content.innerHTML = @content
		$content.style.display = 'table-cell'
		$content.style.verticalAlign = 'middle'
		$content.style.padding = '0 0.5em'
		
		$node.appendChild $content
		$node.style.display = 'none'
		panes.floatPane.appendChild $node
		
		do @panMap
		
	else if $node.parentNode isnt panes.floatPane
		# The panes have changed. Move the $node.
		console.log 'else if', @
		panes.floatPane.appendChild $node.parentNode.removeChild $node
	else
		console.log 'else'
		# The panes have not changed, so no need to create or move the $node.

# Pan the map to fit the InfoBox.
InfoBox::panMap = ->
	# if we go beyond map, pan map.
	map = @map
	bounds = do map.getBounds
	
	if not bounds then return

	# The position of the infowindow.
	position = @point

	# The offset position of the infowindow.
	boxOffsetX = @offsetHorizontal
	boxOffsetY = @offsetVertical

	# Padding on the infowindow.
	boxPaddingX = 40
	boxPaddingY = 40

	# The degrees per pixel.
	mapDiv = do map.getDiv
	mapWidth = mapDiv.offsetWidth
	mapHeight = mapDiv.offsetHeight
	
	spanBounds = do bounds.toSpan
	spanLong = do spanBounds.lng
	spanLat = do spanBounds.lat
	degreesPixelX = spanLong / mapWidth
	degreesPixelY = spanLat / mapHeight

	# The bounds of the map.
	mapWestLng = do bounds.getSouthWest().lng
	mapEastLng = do bounds.getNorthEast().lng
	mapNorthLat = do bounds.getNorthEast().lat
	mapSouthLat = do bounds.getSouthWest().lat

	# The bounds of the infowindow.
	boxWestLng = position.lng() + ( boxOffsetX - boxPaddingX ) * degreesPixelX
	boxEastLng = position.lng() + ( boxOffsetX + @width + boxPaddingX ) * degreesPixelX
	boxNorthLat = position.lat() - ( boxOffsetY - boxPaddingY ) * degreesPixelY
	boxSouthLat = position.lat() - ( boxOffsetY + @height + boxPaddingY ) * degreesPixelY

	# Calculate center shift.
	shiftLng = ( if boxWestLng < mapWestLng then mapWestLng - boxWestLng else 0 ) + ( if boxEastLng > mapEastLng then mapEastLng - boxEastLng else 0 )
	shiftLat = ( if boxNorthLat > mapNorthLat then mapNorthLat - boxNorthLat else 0 ) + ( if boxSouthLat < mapSouthLat then mapSouthLat - boxSouthLat else 0 )

	# The center of the map.
	center = do map.getCenter
	
	# The new map center.
	centerX = center.lng() - shiftLng
	centerY = center.lat() - shiftLat
	
	# Center the map to the new shifted center.
	map.panTo new google.maps.LatLng centerY, centerX

	# Remove the listener after panning is complete.
	google.maps.event.removeListener @onboundsChange
	@onboundsChange = null

exports.InfoBox = InfoBox