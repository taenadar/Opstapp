exports = @

WAYPOINTS = [
	{
		"artiest" : "Rembrandt",
		"stuk" : "Nachtwacht",
		"latlng" : [ 52.368268, 4.895656 ],
		"opmerking" : "Originele plek van de nachtwacht",
		"link" : ""
	},
	{
		"artiest" : "Rembrandt",
		"stuk" : "De staalmeesters",
		"latlng" : [ 52.368289, 4.897228 ],
		"opmerking" : "Originele plek en thema",
		"link" : ""
	},
	{
		"artiest" : "George Hendrik Breitner",
		"stuk" : "Buurtje in de Amsterdamse Jordaan",
		"latlng" : [ 52.383324, 4.885024 ],
		"opmerking" : "Hier is het schilderij op gebasseerd",
		"link" : ""
	},
	{
		"artiest" : "George Hendrik Breitner",
		"stuk" : "De Singelbrug bij de Paleisstraat",
		"latlng" : [ 52.3722, 4.888433 ],
		"opmerking" : "",
		"link" : "https://www.rijksmuseum.nl/nl/collectie/SK-A-3580"
	},
	{
		"artiest" : "George Hendrik Breitner",
		"stuk" : "De Dam te Amsterdam",
		"latlng" : [ 52.373058, 4.892864 ],
		"opmerking" : "",
		"link" : "https://www.rijksmuseum.nl/nl/collectie/SK-A-3659"
	},
	{
		"artiest" : "Rembrandt",
		"stuk" : "Eerste verkochte schilderij",
		"latlng" : [ 52.371473, 4.880612 ],
		"opmerking" : "Aan deze gracht woonde de eerste koper van een van Rembrandts stukken. (misschien leuk om te weten)",
		"link" : "http://nl.wikipedia.org/wiki/Johan_Huydecoper_van_Maarsseveen_(1599-1661)"
	},
	{
		"artiest" : "Rembrandt",
		"stuk" : "Standbeeld van Rembrandt op de Botermarkt",
		"latlng" : [ 52.366085, 4.896727 ],
		"opmerking" : "",
		"link" : "https://www.rijksmuseum.nl/nl/collectie/RP-F-F01710-B"
	},
	{
		"artiest" : "Beerstraten",
		"stuk" : "Heiligewegspoort te Amsterdam in de winter",
		"latlng" : [ 52.367238, 4.889554 ],
		"opmerking" : "staat nog wat info over op wiki",
		"link" : "https://www.rijksmuseum.nl/nl/collectie/RP-T-1905-48 , http://nl.wikipedia.org/wiki/Heiligewegspoort"
	},
	{
		"artiest" : "Beerstraten",
		"stuk" : "Schreijerstoren te Amsterdam",
		"latlng" : [ 52.376595, 4.90222 ],
		"opmerking" : "",
		"link" : "https://www.rijksmuseum.nl/nl/collectie/RP-T-1888-A-1559"
	},
	{
		"artiest" : "George Hendrik Breitner",
		"stuk" : "Het Rokin in Amsterdam",
		"latlng" : [ 52.368856, 4.892843 ],
		"opmerking" : "",
		"link" : "https://www.rijksmuseum.nl/nl/collectie/SK-A-3579"
	},
	{
		"artiest" : "Johannes Jelgerhuis",
		"stuk" : "De Amsterdamse buitensingel bij de Leidsepoort",
		"latlng" : [ 52.363585, 4.882028 ],
		"opmerking" : "",
		"link" : "https://www.rijksmuseum.nl/nl/collectie/SK-A-1055"
	},
	{
		"artiest" : "Jan van der Heyden",
		"stuk" : "Amsterdams stadsgezicht met huizen aan de Herengracht",
		"latlng" : [ 52.379149, 4.89177 ],
		"opmerking" : "",
		"link" : "https://www.rijksmuseum.nl/nl/collectie/SK-A-154"
	},
	{
		"artiest" : "Gerrit Adriaensz. Berckheyde",
		"stuk" : "De Gouden Bocht in de Herengracht",
		"latlng" : [ 52.363893, 4.892188 ],
		"opmerking" : "",
		"link" : "https://www.rijksmuseum.nl/nl/collectie/SK-A-5003"
	},
	{
		"artiest" : "George Hendrik Breitner",
		"stuk" : "De Singelbrug bij de Paleisstraat in Amsterdam",
		"latlng" : [ 52.372196, 4.888567 ],
		"opmerking" : "",
		"link" : "https://www.rijksmuseum.nl/nl/search/objecten?q=George+Hendrik+Breitner&p=1&ps=12#/SK-A-3580,1"
	},
	{
		"artiest" : "George Hendrik Breitner",
		"stuk" : "Trampaarden op de Dam te Amsterdam",
		"latlng" : [ 52.372812, 4.892961 ],
		"opmerking" : "",
		"link" : "https://www.rijksmuseum.nl/nl/search/objecten?p=1&ps=12&maker=George+Hendrik+Breitner#/SK-A-3658,3"
	}
]



waypoints = []

# Hide from "global" scope.
do ->
	iterator = -1
	length = WAYPOINTS.length
	
	while ++iterator < length
	
		waypoint = WAYPOINTS[ iterator ]
		latLng = new google.maps.LatLng waypoint.latlng[ 0 ], waypoint.latlng[ 1 ]
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

polyLine = new google.maps.Polyline
	'strokeColor' : '#42a68c'
	'strokeOpacity' : 1
	'strokeWeight' : 2
	'map' : map

markerIcon = 
	'scaledSize' : new google.maps.Size 20, 35
	'size' : new google.maps.Size 20, 35
	'url' : './asset/image/map/marker_closed.png'

openMarkerIcon =
	'scaledSize' : new google.maps.Size 20, 35
	'size' : new google.maps.Size 20, 35
	'url' : './asset/image/map/marker.png'

directionsRenderer = new google.maps.DirectionsRenderer
	'polylineOptions' : polyLine
	'suppressMarkers' : true
	'suppressInfoWindows' : true
	'map' : map

# polyLine.setMap map

# Set the map to display direction.
# directionsRenderer.setMap map

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
		
		path = response.routes[ 0 ].overview_path
		boxes = routeBoxer.box path, 0.05

		findPointsOnRoute boxes, origin, destination


findPointsOnRoute = ( boxes, origin, destination ) ->
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
	drawNewRoute waypts, origin, destination


makeMarker = ( position, icon, title ) ->
	new google.maps.Marker
		'position' : position
		'map' : map
		'icon' : icon
		'title' : title
		'animation' : google.maps.Animation.DROP
		'flat' : true
		'optimized' : false


currentMarker = null


visualizeLeg = ( address, point, waypoint, index, length ) ->
	if index is 0
		title = 'start'
		icon = openMarkerIcon
	else if index is length
		title = 'end'
		icon = openMarkerIcon
	else
		title = 'waypoint'
		icon = markerIcon
		point.waypoint = waypoint.location.waypoint
	
	if point.waypoint
		content = "<b>#{point.waypoint.stuk}</b><br/>#{point.waypoint.artiest}<br/><a class=\"button-primary button-block button-large\" href=\"#{point.waypoint.link}\">Op naar het Rijks!</a>"
	else
		content = "<b>#{address}</b>"
		
	window.setTimeout ->
			marker = makeMarker point, icon, title
			
			console.log index, point.waypoint
			
			marker.info = new google.maps.InfoWindow
				'content' : content
			
			google.maps.event.addListener marker, 'click', ->
				if currentMarker
					do currentMarker.info.close
				
				currentMarker = marker
				g = marker.info.open map, marker
				p = @info.d.f.parentElement
				exports.x = @info.d.f
			
		, index * 200

google.maps.event.addListener map, 'click', ->
	if currentMarker
		do currentMarker.info.close
		currentMarker = null

drawNewRoute = ( waypts, origin, destination ) ->
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
		
		leg = legs[ length - 1 ]
		visualizeLeg destination, leg.end_location, null, iterator, length
		
