exports = @

app = exports.app or exports.app = {}
app.locationManager

WAYPOINTS = app.data

waypoints = []

# Hide from "global" scope.
do ->
	iterator = -1
	length = WAYPOINTS.length
	
	while ++iterator < length
	
		waypoint = WAYPOINTS[ iterator ]
		latLng = new google.maps.LatLng waypoint.latitude, waypoint.longitude
		latLng.waypoint = waypoint
		waypoints[ iterator ] = latLng

# Create a new Google Maps style.

styledMap = new google.maps.StyledMapType [
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
,
	'name' : 'Salt & Pepper'

# Select the map node.
$map = document.getElementById 'map-canvas'

# Create the actualy map on the map element.
map = new google.maps.Map $map,
	'zoom' : 14
	'center' : new google.maps.LatLng 52.359903, 4.884131
	'mapTypeControlOptions' :
		'mapTypeIds' : [ google.maps.MapTypeId.ROADMAP, 'map_style' ]

# Set the style of the just created map based on previously created style.
map.mapTypes.set 'map_style', styledMap

# Set the maps ID.
map.setMapTypeId 'map_style'

directionsRenderer = new google.maps.DirectionsRenderer
	'suppressMarkers' : true
	'suppressInfoWindows' : true
	'map' : map
	'polylineOptions' :
		'strokeColor' : '#5e99b0'
		'strokeOpacity' : 0.8
		'strokeWeight' : 3

markerIcons = {}

do ->
	iterator = -1
	length = 8

	while ++iterator < length
		markerIcons[ iterator ] = 
			'scaledSize' : new google.maps.Size 20, 35
			'size' : new google.maps.Size 20, 35
			'url' : "./asset/image/map/marker_closed_#{iterator + 1}.png"
	
markerIcons.a = 
	'scaledSize' : new google.maps.Size 20, 35
	'size' : new google.maps.Size 20, 35
	'url' : "./asset/image/map/marker_closed_a.png"

markerIcons.b = 
	'scaledSize' : new google.maps.Size 20, 35
	'size' : new google.maps.Size 20, 35
	'url' : "./asset/image/map/marker_closed_b.png"

markerIcons.user = 
	'scaledSize' : new google.maps.Size 19, 19
	'size' : new google.maps.Size 19, 19
	'url' : "./asset/image/map/marker_closed_user.png"

markerIcon = 
	'scaledSize' : new google.maps.Size 20, 35
	'size' : new google.maps.Size 20, 35
	'url' : './asset/image/map/marker_closed.png'

openMarkerIcon =
	'scaledSize' : new google.maps.Size 20, 35
	'size' : new google.maps.Size 20, 35
	'url' : './asset/image/map/marker.png'

routeBoxer = new RouteBoxer
directionsService = new google.maps.DirectionsService

exports.locationsArray = locationsArray = [
	  new google.maps.LatLng( 52.368268, 4.895656 )
	, new google.maps.LatLng( 52.368289, 4.897228 )
	, new google.maps.LatLng( 52.383324, 4.885024 )
	, new google.maps.LatLng( 52.3722, 4.888433 )
	, new google.maps.LatLng( 52.373058, 4.892864 )
	, new google.maps.LatLng( 52.371473, 4.880612 )
	, new google.maps.LatLng( 52.366085, 4.896727 )
	, new google.maps.LatLng( 52.367238, 4.889554 )
	, new google.maps.LatLng( 52.376595, 4.90222 )
	, new google.maps.LatLng( 52.368856, 4.892843 )
]


calcRoute = ( start, end, distance ) ->
	do clearMap
	waypts = []
	origin = do start.toString
	destination = do end.toString
	
	request =
		'origin' : origin
		'destination' : destination
		'waypoints' : waypts
		'optimizeWaypoints' : true
		'travelMode' : google.maps.TravelMode.WALKING

	directionsService.route request, ( response, status ) ->
		if status isnt google.maps.DirectionsStatus.OK then return
		
		path = response.routes[ 0 ].overview_path
		findPointsOnRoute path, origin, destination, distance


findPointsOnRoute = ( path, origin, destination, distance ) ->
	boxes = routeBoxer.box path, distance
	waypts = []
	
	iterator = -1
	length = boxes.length
	
	boxpolys = new Array length
	
	while ++iterator < length
		bounds = boxes[ iterator ]
		
		iterator_ = -1
		length_ = waypoints.length
		
		while ++iterator_ < length_
			if bounds.contains waypoints[ iterator_ ]
				waypts.push
					'location' : waypoints[ iterator_ ]
					'stopover' : true
	
	if waypts.length > 8 and distance > 0
		findPointsOnRoute path, origin, destination, distance - 0.1
	else if waypts.length < 2 and distance < 5
		findPointsOnRoute path, origin, destination, distance + 0.1
	else
		if waypts.length > 8
			waypoints = waypoints.slice 0, 8
		
		drawNewRoute waypts, origin, destination, distance
	
	@

markers = []
currentMarker = null
currentUser = null

updateBounds = ->
	bounds = new google.maps.LatLngBounds
	
	if currentUser
		bounds.extend currentUser.position
	
	iterator = -1
	length = markers.length
	
	while ++iterator < length
		bounds.extend markers[ iterator ].position
	
	map.fitBounds bounds

	undefined

onLocationUpdate = ( position ) ->
	coords = position.coords
	latLng = new google.maps.LatLng coords.latitude, coords.longitude
	
	if currentUser
		currentUser.setPosition latLng
	else
		currentUser = new google.maps.Marker
			'position' : latLng
			'map' : map
			'icon' : markerIcons.user
			'title' : 'current location.'
			'animation' : google.maps.Animation.DROP
			'flat' : true
	
	do updateBounds
	undefined

clearMap = ->
	
	app.locationManager.off onLocationUpdate
	
	# Remove markers
	iterator = -1
	length = markers.length
	
	while ++iterator < length
		markers[ iterator ].setMap null
	
	markers = []
	currentMarker = null
	
	@

makeMarker = ( position, icon, title ) ->
	marker = new google.maps.Marker
		'position' : position
		'map' : map
		'icon' : icon
		'title' : title
		'animation' : google.maps.Animation.DROP
		'flat' : true
		'optimized' : false
	
	markers.push marker
	
	marker

visualizeLeg = ( address, point, waypoint, index, length ) ->
	if index is 0
		title = 'start'
		icon = markerIcons.a or markerIcon
	else if index is length
		title = 'end'
		icon = markerIcons.b or markerIcon
	else
		title = 'waypoint'
		icon = markerIcons[ index - 1 ] or markerIcon
		point.waypoint = waypoint.location.waypoint
	
	if point.waypoint
		console.log 'point', point
		content = "<b>#{point.waypoint.piece}</b><br/>#{point.waypoint.artist}<br/><a class=\"button-primary button-block button-large button-map\" href=\"#{point.waypoint.link}\">Meer info »</a>"
	else
		content = "<b>#{address}</b>"
		
	window.setTimeout ->
			marker = makeMarker point, icon, title
			
			marker.info = new google.maps.InfoWindow
				'content' : content
			
			google.maps.event.addListener marker, 'click', ->
				if currentMarker
					do currentMarker.info.close
				
				marker.info.open map, marker
				currentMarker = marker
			
		, index * 200

google.maps.event.addListener map, 'click', ->
	if currentMarker
		do currentMarker.info.close
		currentMarker = null

drawNewRoute = ( waypts, origin, destination, distance ) ->
	app.locationManager.on onLocationUpdate
	
	request =
		'origin' : origin
		'destination' : destination
		'waypoints' : waypts
		'optimizeWaypoints' : true
		'travelMode' : google.maps.TravelMode.WALKING
	
	directionsService.route request, ( response, status ) ->
		if status isnt google.maps.DirectionsStatus.OK then return
		
		directionsRenderer.setDirections response
		
		route = response.routes[ 0 ]
		
		legs = route.legs
		
		iterator = -1
		length = legs.length
		
		while ++iterator < length
			leg = legs[ iterator ]
			address = leg.start_address
			if iterator > 0
				waypoint = waypts[ route.waypoint_order[ iterator - 1 ] ]
			else
				waypoint = null
				address = origin
			
			visualizeLeg leg.start_address, leg.start_location, waypoint, iterator, length
			do updateBounds
		
		leg = legs[ length - 1 ]
		visualizeLeg destination, leg.end_location, null, iterator, length
		
		do updateBounds
		

exports.calcRoute = calcRoute