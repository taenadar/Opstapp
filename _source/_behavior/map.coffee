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


directionsService = new google.maps.DirectionsService
directionsRenderer = new google.maps.DirectionsRenderer

# Set the map to display direction.
directionsRenderer.setMap map

# NOT FINISHED.
# Calculate a route.
exports.calculateRoute = ( start, end ) ->
	origin = do start.toString
	destination = do end.toString
	travelMode = google.maps.DirectionsTravelMode.WALKING
	
	request =
		'origin' : origin
		'destination' : destination
		'travelMode' : travelMode

	directionsService.route request, ( response, status ) ->
		if status is google.maps.DirectionsStatus.OK
			directionsRenderer.setDirections response
