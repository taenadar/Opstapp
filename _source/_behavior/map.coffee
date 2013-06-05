exports = @

app = exports.app or exports.app = {}


app.options or app.options = {}

app.options.directionsRenderer =
	'suppressMarkers' : true
	'suppressInfoWindows' : true
	# 'map' : map

app.options.polylineOptions =
	'strokeColor' : '#5e99b0'
	'strokeOpacity' : 0.8
	'strokeWeight' : 3

app.options.mapStyles =
	'dark' : [
			'featureType': 'landscape.natural',
			'stylers': [
					{ 'color': '#3c3c3c' },
					{ 'visibility': 'on' }
				]
			,
				'featureType': 'landscape.man_made',
				'elementType': 'geometry',
				'stylers': [
					{ 'color': '#2f2f2f' },
					{ 'visibility': 'on' }
				]
			,
				'featureType': 'water',
				'elementType': 'geometry',
				'stylers': [
					{ 'visibility': 'on' },
					{ 'color': '#434343' }
				]
			,
				'featureType': 'administrative',
				'elementType': 'geometry',
				'stylers': [
					{ 'visibility': 'on' },
					{ 'color': '#808080' }
				]
			,
				'featureType': 'road',
				'elementType': 'geometry',
				'stylers': [
					{ 'color': '#000000' },
					{ 'visibility': 'on' }
				]
			,
				'featureType': 'transit',
				'stylers': [
					{ 'color': '#4c4c4c' },
					{ 'visibility': 'on' }
				]
			,
				'featureType': 'poi',
				'stylers': [
					{ 'visibility': 'off' }
				]
			,
				'elementType': 'labels',
				'stylers': [
					{ 'visibility': 'off' }
				]
		]

app.options.icons =
	'1' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_1.png'
	'2' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_2.png'
	'3' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_3.png'
	'4' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_4.png'
	'5' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_5.png'
	'6' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_6.png'
	'7' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_7.png'
	'8' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_8.png'
	'a' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_a.png'
	'b' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_b.png'
	'user' :
		'size' : [ 19, 19 ]
		'url' : './asset/image/map/marker_closed_user.png'
	'default' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed.png'
	








# waypoints = []

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

MapView::setService = ( options ) ->
	
	@service = new google.maps.DirectionsService options
	
	@

MapView::activateMapStyle = ( name ) ->
	
	if not @_mapStyles[ name ] then return
	
	@_map.mapTypes.set name, @_mapStyles[ name ]
	
	@_map.setMapTypeId name
	
	@

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
	
	@_icons[ name ] = 
		'scaledSize' : size
		'size' : size
		'url' : icon.url
	
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
			origin = origin.replace @REGEXP_LAT_LONG, 'huidige locatie'
			destination = destination.replace @REGEXP_LAT_LONG, 'huidige locatie'
			summary = response.routes[ 0 ].summary
			
			if origin is destination
				callback "De applicatie kon geen punten vinden in de buurt van \"#{summary}\"."
			else
				callback "De applicatie kon geen punten vinden tussen \"#{origin}\" en \"#{destination}\""
			
			return
		
		@calculateRoute points, origin, destination, callback
	
	@

MapView::metersToString = ( meters ) ->
	kilometers = meters / 1000
	kilometers = Math.floor( kilometers * 10 ) / 10
	
	"#{kilometers}km"

MapView::secondsToString = ( seconds ) ->
	minutes = seconds / 60
	minutes = Math.round minutes
	
	hours = 0
	
	while minutes > 59
		minutes -= 60
		hours += 1
	
	if hours < 10
		hours = '0' + hours
	
	if minutes < 10
		minutes = '0' + minutes
	
	"#{hours}:#{minutes}"


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
		
		calculatedRoute =
			'points' : points_
			'origin' : origin
			'destination' : destination
			'distance' : @metersToString distance
			'duration' : @secondsToString duration
			'response' : response
		
		@renderRoute calculatedRoute, callback
	
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

MapView::renderPoint = ( point, index, length ) ->
	
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
				
		, index * 300
	
	@

MapView::renderPoints = ( points ) ->
	
	iterator = -1
	length = points.length
	
	@renderPoint points[ iterator ], iterator, length while ++iterator < length
	
	@

MapView::renderRoute = ( route, callback ) ->
	
	do @clear
	
	if callback then do callback
	
	@renderer.setDirections route.response
	
	@renderPoints route.points
	
	do @updateBounds
	
	@

rendererOptions = app.options.directionsRenderer
rendererOptions.polylineOptions = app.options.polylineOptions

mapView = new MapView ( $$ '#map-canvas' ),
	'zoom' : 14
	'center' : new google.maps.LatLng 52.359903, 4.884131
	'disableDefaultUI' : true

mapView.setMapStyles app.options.mapStyles
mapView.setIcons app.options.icons
mapView.setRenderer rendererOptions
mapView.setService {}
mapView.setRouteBoxer new RouteBoxer

mapView.activateMapStyle 'dark'

app.mapView = mapView
