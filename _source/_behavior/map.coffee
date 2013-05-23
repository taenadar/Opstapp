exports = @


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

# Create new a point.
start = new google.maps.LatLng 52.359903, 4.884131

# Create the actualy map on the map element.
map = new google.maps.Map $map,
	'zoom' : 14
	'center' : start
	'mapTypeControlOptions' :
		'mapTypeIds' : [ google.maps.MapTypeId.ROADMAP, 'map_style' ]

# Set the style of the just created map based on previously created style.
map.mapTypes.set 'map_style', styledMap

# Set the maps ID.
map.setMapTypeId 'map_style'


polyLine = new google.maps.Polyline
	'strokeColor' : '#42a68c'
	'strokeOpacity' : 1
	'strokeWeight' : 2

marker = new google.maps.Marker
	'icon' :
		'scaledSize' : new google.maps.Size 20, 35
		'size' : new google.maps.Size 20, 35
		'url' : './asset/image/map/marker_closed.png'
	'animation' : google.maps.Animation.DROP
	'flat' : true
	'optimized' : false


directionsService = new google.maps.DirectionsService
directionsRenderer = new google.maps.DirectionsRenderer
	'polylineOptions' : polyLine
	'markerOptions' : marker

console.log marker

# directionsRenderer.set 'markerOptions', marker
polyLine.setMap map
# marker.setMap map

# Set the map to display direction.
directionsRenderer.setMap map


routeBoxer = new RouteBoxer

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


exports.calcRoute = calcRoute = ( start, end ) ->
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
		
		# directionsRenderer.setDirections response
		path = response.routes[ 0 ].overview_path
		boxes = routeBoxer.box path, 0.15

		findPointsOnRoute boxes, origin, destination


findPointsOnRoute = ( boxes, origin, destination ) ->
	waypts = []
	
	iterator = -1
	length = boxes.length
	
	boxpolys = new Array length
	
	while ++iterator < length
		bounds = boxes[ iterator ]
		
		iterator_ = -1
		length_ = locationsArray.length
		
		while ++iterator_ < length_
			if bounds.contains locationsArray[ iterator_ ]
				waypts.push
					'location' : locationsArray[ iterator_ ]
					'stopover' : true
					
	drawNewRoute waypts, origin, destination

drawNewRoute = ( waypts, origin, destination ) ->
	request =
		'origin' : origin
		'destination' : destination
		'waypoints' : waypts
		'optimizeWaypoints' : true
		'travelMode' : google.maps.TravelMode.WALKING
	
	directionsService.route request, ( response, status ) ->
		if status isnt google.maps.DirectionsStatus.OK then return
		
		# path = do polyLine.getPath
		
		# Because path is an MVCArray, we can simply append a new coordinate
		# and it will automatically appear.
		# iterator = -1
		# length = response.length
		
		# while ++iterator < length
		# 	path.push repsonse[ iterator ]
		
		directionsRenderer.setDirections response
		console.log directionsRenderer
	
