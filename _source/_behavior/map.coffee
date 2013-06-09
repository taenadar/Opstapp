exports = @

# Constructor, taking a node (to be used as the map canvas), and an options 
# object.
MapView = ( $node, options ) ->
	
	@_mapStyles = {}
	
	@_map = new google.maps.Map $node, options
	
	@_markers = []
	@_marker = null
	
	app.locationManager.on => @onLocationUpdate.apply @, arguments
	google.maps.event.addListener @_map, 'click', => @onClick.apply @, arguments
	
	@

# RegExp matching LatLong strings.
MapView::REGEXP_LAT_LONG = /(?:\d{1,2}\.\d*),(?:\d{1,2}\.\d*)/

# Create new renderer, passing it the given options.
MapView::setRenderer = ( options ) ->
	
	# Remove current renderer, if set.
	if @_renderer then @_renderer.setMap null
	
	@_renderer = new google.maps.DirectionsRenderer options
	
	# Show new renderer.
	@_renderer.setMap @_map
	
	@

# Set `polylineOptions` on `renderer` to the given options.
MapView::setPolylineOptions = ( options ) ->
	
	@_renderer.set 'polylineOptions', options
	
	@

MapView::setService = ( options ) ->
	
	# Create a new service, passing it the given options.
	@_service = new google.maps.DirectionsService options
	
	@

# Activate a map style, using the given name.
MapView::activateMapStyle = ( name ) ->
	
	if not @hasMapStyle name then return
	
	@_map.mapTypes.set name, @_mapStyles[ name ]
	
	@_map.setMapTypeId name
	
	@

# Return whether or not a style is available by the given name.
MapView::hasMapStyle = ( name ) ->
	
	not not @_mapStyles[ name ]

# Add a `StyledMapType`.
MapView::setMapStyle = ( name, style ) ->
	
	@_mapStyles[ name ] = new google.maps.StyledMapType style,
		'name' : name
	
	@

# Add multiple `StyledMapType`'s.
MapView::setMapStyles = ( styles ) ->
	
	@setMapStyle key, value for key, value of styles
	
	@

# Set an icon.
MapView::setIcon = ( name, icon ) ->
	
	@_icons or @_icons = {}
	
	size = new google.maps.Size icon.size[ 0 ], icon.size[ 1 ]
	
	options = {}
	
	if size then options.size = options.scaledSize = size
	
	if icon.anchor then options.anchor = new google.maps.Point icon.anchor[ 0 ], icon.anchor[ 1 ]
	
	if icon.url then options.url = icon.url
	
	@_icons[ name ] = options
	
	@

# Get an icon, return default if not available.
MapView::getIcon = ( name ) ->
	
	if not @_icons then return false
	
	@_icons[ name ] or @_icons[ 'default' ] or false

# Set multiple icons.
MapView::setIcons = ( icons ) ->
	
	@_icons or @_icons = {}
	
	@setIcon key, value for key, value of icons
	
	@

# Set an instance of `RouteBoxer`.
MapView::setRouteBoxer = ( routeBoxer ) ->
	
	@_boxer = routeBoxer
	
	@

# Add an icon at the given `position`.
MapView::onLocationUpdate = ( position ) ->
	coords = position.coords
	latLng = new google.maps.LatLng coords.latitude, coords.longitude
	
	if @_currentUser
		@_currentUser.setPosition latLng
	else
		@_currentUser = new google.maps.Marker
			'position' : latLng
			'map' : @_map
			'icon' : @getIcon 'user'
			'title' : 'Huidige locatie.'
			'animation' : google.maps.Animation.DROP
			'flat' : true
			'optimized' : false
			'visible' : true
	
	@

# Remove all markers, infoWindows, and routes from `map`.
MapView::clear = ->
	
	@_renderer.setMap null
	iterator = -1
	length = @_markers.length
	
	while ++iterator < length
		marker = @_markers[ iterator ]
		marker.setMap null
		
		if marker.infoWindow then marker.infoWindow.setMap null
	
	@_markers = []
	@_marker = null
	
	@

# Request a route, given an `origin`, `destination`, best-case `distance`, and 
# `callback`.
MapView::requestRoute = ( origin, destination, distance, callback ) ->
	
	# Convert `origin` and `destination` to string.
	origin = do origin.toString
	destination = do destination.toString

	# Set up `request` object.
	request =
		'origin' : origin
		'destination' : destination
		'travelMode' : google.maps.TravelMode.WALKING
	
	# Call `@_service.route` with the `request` object, and a callback function.
	@_service.route request, ( response, status ) =>
		
		# If there was an error...
		if status isnt google.maps.DirectionsStatus.OK
			
			# Try again, specifying Amsterdam.
			# if -1 is origin.indexOf 'Amsterdam'
			# 	@requestRoute origin + ' Amsterdam, Netherlands', destination, distance, callback
			# else if -1 is destination.indexOf 'Amsterdam'
			# 	@requestRoute origin, destination + ' Amsterdam, Netherlands', distance, callback
			# If Amsterdam was specified on both `origin` and `destination`,
			# fail.
			# else
			console.log '---|', @, arguments
			throw new Error 'Uncatched error in `MapView::requestRoute`'
			
			return
		
		# If there was no error, find points on the resulting route.
		@findPointsOnRoute response, origin, destination, distance, callback
		
		return
	
	@

MapView::findPointsOnRoute = ( response, origin, destination, distance, callback ) ->

	path = response.routes[ 0 ].overview_path
	boxes = @_boxer.box path, distance

	points_ = do app.dataManager.getPointsAsArray

	points = []

	iterator = -1
	length = boxes.length

	while ++iterator < length
		box = boxes[ iterator ]

		iterator_ = -1
		length_ = points_.length

		while ++iterator_ < length_
			point = points_[ iterator_ ]

			if box.contains point.latLng then points.push point.waypoint

	if points.length > 8 and distance >= 0.2
		@findPointsOnRoute response, origin, destination, distance - 0.1, callback
	else if points.length < 4 and distance < 10
		@findPointsOnRoute response, origin, destination, distance + 0.1, callback
	else
		if points.length > 8
			points = points.slice 0, 8
		else if points.length < 1
			if origin is destination
				summary = response.routes[ 0 ].summary
				callback
					'error' : """
						De applicatie kon geen punten vinden in de buurt van
						"#{summary}".
						"""
			else
				origin = origin.replace @REGEXP_LAT_LONG, 'huidige locatie'
				destination = destination.replace @REGEXP_LAT_LONG, 'huidige locatie'

				callback
					'error' : """
						De applicatie kon geen punten vinden tussen "#{origin}" 
						en "#{destination}"
						"""

			return

		@calculateRoute points, origin, destination, callback

	@

# Transform meters to a nicely rounded kilometer string.
MapView::metersToString = ( meters ) ->
	kilometers = meters / 1000
	kilometers = Math.ceil( kilometers )
	
	"Afstand: #{kilometers}km"

# Transform seconds to a nicely rounded hour/minutes string.
MapView::secondsToString = ( seconds ) ->
	minutes = seconds / 60
	minutes = 15 * Math.ceil minutes / 15
	
	hours = 0
	
	while minutes > 59
		minutes -= 60
		hours += 1
	
	if minutes < 10
		minutes = '0' + minutes
	
	"Tijd: #{hours}h #{minutes}m"

# Onclick handler
MapView::onClick = ->
	
	# If there currently is a marker show, close it.
	if @_marker and @_marker.infoWindow
		do @_marker.infoWindow.close
		@_marker = null

# Calculate a route, given several points, `origin`, `destination`, and  
# `callback`.
MapView::calculateRoute = ( points, origin, destination, callback ) ->
	
	# Set up `request` object.
	request =
		'origin' : origin
		'destination' : destination
		'waypoints' : points
		'optimizeWaypoints' : true
		'travelMode' : google.maps.TravelMode.WALKING
	
	# Call `@_service.route` with the `request` object, and a callback function.
	@_service.route request, ( response, status ) =>
		
		# If there was an error...
		if status isnt google.maps.DirectionsStatus.OK
			
			# Throw.
			console.log '---|', @, arguments
			throw new Error 'Uncatched error in `MapView::calculateRoute`'
			
			return
		
		# Get the best route.
		route = response.routes[ 0 ]
		legs = route.legs
		
		distance = 0
		duration = 0
		points_ = []
		
		# If `lat` and `lng` are set on `origin`, it's a point from 
		# `dataManager`.
		if origin.lat and origin.lng
			origin_ = app.dataManager.getPointByLocation origin
		# If `lat` and `lng` are set on `destination`, it's a point from 
		# `dataManager`.
		if destination.lat and destination.lng
			destination_ = app.dataManager.getPointByLocation destination
		
		# Add `origin` to `points_`
		if origin_
			points_.push origin_
		else
			point = legs[ 0 ]
			points_.push
				'isPoint' : false
				'latLng' : point.start_location
				'piece' : point.start_address
		
		iterator = 0
		length = legs.length
		
		# Iterate over all legs.
		while ++iterator < length
			leg = legs[ iterator ]
			address = leg.start_address
			
			# Add distance and duration.
			distance += leg.distance.value
			duration += leg.duration.value
			
			index = route.waypoint_order[ iterator - 1 ]
			
			# Push the point if it's en route.
			if index isnt undefined
				location = points[ index ].location
				points_.push app.dataManager.getPointByLocation location
		
		# Add `destination` to `points_`
		if destination_
			points_.push destination_
		else
			point = legs[ length - 1 ]
			points_.push
				'isPoint' : false
				'latLng' : point.end_location
				'piece' : point.end_address
		
		# Add some viewing time to `duration` (3 minutes per point).
		duration += points.length * 3 * 60
		
		# Call callback with all the calculated information.
		callback
			'points' : points_
			'origin' : origin
			'destination' : destination
			'distance' : @metersToString distance
			'duration' : @secondsToString duration
			'response' : response
	
		return
	
	@

# Update bounds of map, based on all markers, and the position of `user`.
MapView::updateBounds = ->
	
	bounds = new google.maps.LatLngBounds
	
	iterator = -1
	length = @_markers.length
	bounds.extend @_markers[ iterator ].position while ++iterator < length
	
	if @_currentUser then bounds.extend @_currentUser.position
	
	@_map.fitBounds bounds

	@

# Render a point, given a `point`, `index` (number of icon to use), `timeout` 
# (when to animate the point in), and `length` (where point is in the to be 
# rendered points).
MapView::renderPoint = ( point, index, timeout, length ) ->
	
	# If `point` isnt a point from `dataManager`...
	if not point.isPoint
		# If index is the last item in all to be rendered points...
		if index is length - 1
			# Set icon to `b`.
			icon = @getIcon 'b'
		# If index is the first item in all to be rendered points...
		else if index is 0
			# Set icon to `a`.
			icon = @getIcon 'a'
		else
			# Set icon to `default`.
			icon = do @getIcon
	# Else...
	else
		# Show a marker based on `index`.
		icon = @getIcon index
	
	# Set title to the short string in `point.piece`.
	title = point.piece
	
	# If point belongs to an artist, show both the short title and artist in 
	# the info-window.
	if point.artist
		content = "<b>#{point.piece}</b><br/>#{point.artist}<br/>"
	# Otherwise, show only `piece`.
	else
		content = "<b>#{point.piece}</b>"
	
	# Set a timeout to show the marker
	window.setTimeout =>
			
			# Set marker.
			marker = new google.maps.Marker
				'position' : point.latLng
				'map' : @_map
				'icon' : icon
				'title' : title
				'animation' : google.maps.Animation.DROP
				'flat' : true
				'optimized' : false
			
			# Set infoWindow.
			marker.infoWindow = new InfoBox
				'map' : @_map
				'latlng' : point.latLng
				'content' : content
				'onclick' : ( event ) ->
					if app.infoWindowIntent
						event.data = point
						app.infoWindowIntent.apply @, arguments
					
					return
			
			# Add `marker` to all markers.
			@_markers.push marker
			
			# When the user selects `marker`...
			google.maps.event.addListener marker, 'click', =>
				
				# Hide currently open markers.
				do @onClick
				
				# Open the current marker.
				@_marker = marker
				marker.infoWindow.open @_map
				
				return
				
		, timeout
	
	@

# Render multiple points.
MapView::renderPoints = ( points, hideIndex ) ->
	
	iterator = -1
	length = points.length
	
	# If hideIndex isn't truthy...
	if not hideIndex
		
		# If origin is a point...
		if points[ 0 ].isPoint
			# Add one to each index.
			while ++iterator < length
				@renderPoint points[ iterator ], iterator + 1, iterator * 300, length
		else
			# Call renderPoint for each point.
			while ++iterator < length
				@renderPoint points[ iterator ], iterator, iterator * 300, length
	else
		# Call renderPoint for each point, hiding it's index.
		while ++iterator < length
			@renderPoint points[ iterator ], 0, iterator * 100, length
	
	@

# Render a route, given a `route` object.
MapView::renderRoute = ( route ) ->
	
	# Clear all points.
	do @clear
	
	# Update bounds.
	do @updateBounds
	
	# Set directions.
	@_renderer.setDirections route.response
	@_renderer.setMap @_map
	
	# Render all points.
	@renderPoints route.points
	
	# Update bounds.
	do @updateBounds
	
	@

# Export MapView constructor.
exports.MapView = MapView