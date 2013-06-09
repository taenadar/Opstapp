exports = @

app = exports.app or exports.app = {}

MapView = ( $node, options ) ->
	@_$node = $node
	@options = options
	
	@_mapStyles = {}
	
	@_map = new google.maps.Map $node, options
	
	@_markers = []
	@_marker = null
	
	app.locationManager.on => @onLocationUpdate.apply @, arguments
	google.maps.event.addListener @_map, 'click', => @onClick.apply @, arguments
	
	@

MapView::setRenderer = ( options ) ->
	
	if @renderer then @renderer.setMap null
	
	@renderer = new google.maps.DirectionsRenderer options
	@renderer.setMap @_map
	
	@

MapView::setPolylineOptions = ( options ) ->
	
	@renderer.set 'polylineOptions', options
	
	@

MapView::setService = ( options ) ->
	
	@service = new google.maps.DirectionsService options
	
	@

MapView::activateMapStyle = ( name ) ->
	
	if not @_mapStyles[ name ] then return
	
	@_map.mapTypes.set name, @_mapStyles[ name ]
	
	@_map.setMapTypeId name
	
	@

MapView::hasMapStyle = ( name ) ->
	
	not not @_mapStyles[ name ]

MapView::setMapStyle = ( name, style ) ->
	
	@_mapStyles[ name ] = new google.maps.StyledMapType style,
		'name' : name
	
	@

MapView::setMapStyles = ( styles ) ->
	
	@setMapStyle key, value for key, value of styles
	
	@

MapView::setIcon = ( name, icon ) ->
	
	@_icons or @_icons = {}
	
	size = new google.maps.Size icon.size[ 0 ], icon.size[ 1 ]
	
	options = {}
	
	if size then options.size = options.scaledSize = size
	
	if icon.anchor then options.anchor = new google.maps.Point icon.anchor[ 0 ], icon.anchor[ 1 ]
	
	if icon.url then options.url = icon.url
	
	@_icons[ name ] = options
	
	@

MapView::getIcon = ( name ) ->
	
	if not @_icons then return false
	
	@_icons[ name ] or @_icons[ 'default' ] or false

MapView::setIcons = ( icons ) ->
	
	@_icons or @_icons = {}
	
	@setIcon key, value for key, value of icons
	
	@

MapView::setRouteBoxer = ( routeBoxer ) ->
	
	@_boxer = routeBoxer
	
	@

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

MapView::clear = ->
	
	@renderer.setMap null
	iterator = -1
	length = @_markers.length
	
	while ++iterator < length
		marker = @_markers[ iterator ]
		marker.setMap null
		
		if marker.infoWindow then marker.infoWindow.setMap null
	
	@_markers = []
	@_marker = null
	
	@

MapView::requestRoute = ( origin, destination, distance, callback ) ->
	
	origin = do origin.toString
	destination = do destination.toString

	request =
		'origin' : origin
		'destination' : destination
		'travelMode' : google.maps.TravelMode.WALKING

	@service.route request, ( response, status ) =>
		
		if status isnt google.maps.DirectionsStatus.OK
			
			# Try again, specifying Amsterdam.
			if not ~origin.indexOf 'Amsterdam'
				origin += ' Amsterdam, Netherlands'
				destination += ' Amsterdam, Netherlands'
				@requestRoute origin, destination, distance, callback
			else
				console.log '---|', @, arguments
				throw new Error 'Uncatched error in `MapView::requestRoute`'
			
			return
		
		@findPointsOnRoute response, origin, destination, distance, callback
		
		return
	
	@
	
MapView::REGEXP_LAT_LONG = /(?:\d{1,2}\.\d*),(?:\d{1,2}\.\d*)/

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

MapView::metersToString = ( meters ) ->
	kilometers = meters / 1000
	kilometers = Math.ceil( kilometers )
	
	"Afstand: #{kilometers}km"

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

MapView::onClick = ( event ) ->
	if @_marker and @_marker.infoWindow
		do @_marker.infoWindow.close
		@_marker = null

MapView::calculateRoute = ( points, origin, destination, callback ) ->
	
	request =
		'origin' : origin
		'destination' : destination
		'waypoints' : points
		'optimizeWaypoints' : true
		'travelMode' : google.maps.TravelMode.WALKING
	
	@service.route request, ( response, status ) =>
		
		if status isnt google.maps.DirectionsStatus.OK
			
			console.log '---|', @, arguments
			throw new Error 'Uncatched error in `MapView::calculateRoute`'
			
			return
		
		route = response.routes[ 0 ]
		legs = route.legs
		
		distance = 0
		duration = 0
		points_ = []
		
		if origin.lat and origin.lng
			origin_ = app.dataManager.getPointByLocation origin
		if destination.lat and destination.lng
			destination_ = app.dataManager.getPointByLocation destination
		
		iterator = 0
		length = legs.length
		
		if origin_
			points_.push origin_
		else
			point = legs[ 0 ]
			points_.push
				'isPoint' : false
				'latLng' : point.start_location
				'piece' : point.start_address
		
		while ++iterator < length
			leg = legs[ iterator ]
			address = leg.start_address
			
			distance += leg.distance.value
			duration += leg.duration.value
			
			index = route.waypoint_order[ iterator - 1 ]
			
			if index isnt undefined
				location = points[ index ].location
				points_.push app.dataManager.getPointByLocation location
		
		if destination_
			points_.push destination_
		else
			point = legs[ length - 1 ]
			points_.push
				'isPoint' : false
				'latLng' : point.end_location
				'piece' : point.end_address
		
		duration += points.length * 3 * 60
		
		calculatedRoute =
			'points' : points_
			'origin' : origin
			'destination' : destination
			'distance' : @metersToString distance
			'duration' : @secondsToString duration
			'response' : response
		
		
		callback calculatedRoute
	
		return
	
	@

MapView::updateBounds = ->
	
	bounds = new google.maps.LatLngBounds
	
	iterator = -1
	length = @_markers.length
	bounds.extend @_markers[ iterator ].position while ++iterator < length
	
	if @_currentUser then bounds.extend @_currentUser.position
	
	@_map.fitBounds bounds

	@

MapView::renderPoint = ( point, index, timeout, length ) ->
	
	if !point.isPoint
		if index is length - 1
			icon = @getIcon 'b'
		else if index is 0
			icon = @getIcon 'a'
		else
			icon = do @getIcon
	else
		icon = @getIcon index
	
	title = point.piece
	
	if point.artist
		content = "<b>#{point.piece}</b><br/>#{point.artist}<br/>"
	else
		content = "<b>#{point.piece}</b>"
	
	window.setTimeout =>
			
			marker = new google.maps.Marker
				'position' : point.latLng
				'map' : @_map
				'icon' : icon
				'title' : title
				'animation' : google.maps.Animation.DROP
				'flat' : true
				'optimized' : false
			
			marker.infoWindow = new InfoBox
				'map' : @_map
				'latlng' : point.latLng
				'content' : content
				'onclick' : ( event ) ->
					if app.infoWindowIntent
						event.data = point
						app.infoWindowIntent.apply @, arguments
					
					return
			
			@_markers.push marker
			
			google.maps.event.addListener marker, 'click', =>
				do @onClick
				
				@_marker = marker
				marker.infoWindow.open @_map
				
				return
				
		, timeout
	
	@

MapView::renderPoints = ( points, hideIndex ) ->
	
	iterator = -1
	length = points.length
	
	
	if not hideIndex
		originIsPoint = points[ 0 ].isPoint

		if originIsPoint
			while ++iterator < length
				@renderPoint points[ iterator ], iterator + 1, iterator * 300, length
		else
			while ++iterator < length
				@renderPoint points[ iterator ], iterator, iterator * 300, length
	else
		while ++iterator < length
			@renderPoint points[ iterator ], 0, iterator * 100, length
	
	@

MapView::renderRoute = ( route ) ->
	
	do @clear
	do @updateBounds
	
	@renderer.setDirections route.response
	@renderer.setMap @_map
	
	@renderPoints route.points
	
	do @updateBounds
	
	@

exports.MapView = MapView