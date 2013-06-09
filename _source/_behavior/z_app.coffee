# Store scope; probably `window`.
exports = @

app = exports.app or exports.app = {}

app.dataManager = new DataManager
app.dataManager.setPoints app.data
app.dataManager.setRoutes app.route

settingsManager = app.settingsManager = new SettingsManager

settingsManager.setDefault 'map-color', 'dark'


$routeInfo              = $$ '.route-info'

$planner                = $$ '.planner'
$planRoute              = $$ '#plan-route'
$planTo                 = $$ '#plan-route-to'
$planFrom               = $$ '#plan-route-from'
$info                   = $$ '.info-modal'
$uitgestippeld          = $$ '.uitgestippeld-modal'
$walkthrough            = $$ '.walkthrough-modal'
$uitgestippeldCarousel  = $$ '.uitgestippeld-modal .carousel'
$startupImage           = $$ '.startup-image'
$map                    = $$ '.home-modal'
$mapColorOptions        = $ '[name="map-color"]'

app.pointToString = ( point ) ->
	if point.description.length >= point.info.description.length
		description = point.description
	else
		description = point.info.description
	"""
		<header class=\"bar-title\">
			<h3 class=\"title\"><div class="overflow-wrapper">#{point.piece}</div></h3>
			<a class=\"button\" href=\"#info-modal\">sluiten</a>
		</header>
		<div class=\"content\">
			<div class=\"img\" style=\"background-image:url(./asset/image/data/#{point.info.id}_large.jpg)\">
				<img class=\"hidden\" alt=\"\" src=\"./asset/image/data/#{point.info.id}_large.jpg\">
			</div>
			<div class=\"info-wrapper\">
				<h1>#{point.info.title}</h1>
				<h2>#{point.artist}</h2>
				<p>#{description}</p>
				<a class=\"button-primary button-block button-large\" href=\"#{point.link}\">naar het Rijksmuseum</a>
			</div>
		</div>
	"""

app.routeToInfoString = ( route ) ->
	"""
	<div class="route-info-container">
		<span class="route-info-distance">#{route.distance}</span>
		<span class="route-info-duration">#{route.duration}</span>
		<a class="route-info-clear button button-large">Clear</a>
	</div>
	"""

# `infoWindowIntent` is a method that gets called when the user selects one of 
# the info windows.
app.infoWindowIntent = ( event ) ->
	
	point = event.data
	
	if not point.isPoint then return
	
	# Prevent default action, and stop the event from bubbling up.
	do event.preventDefault
	do event.stopPropagation
	
	# Stringify the point, and set the returned value as the content of the 
	# info modal.
	$info.innerHTML = app.pointToString point
	
	# Activate the info modal.
	$info.classList.add 'active'
	
	undefined

app.setMapStyle = ( color ) ->
	
	if not app.mapView.hasMapStyle color then return false
	
	settingsManager.set 'map-color', color
	app.mapView.activateMapStyle color
	
	iterator = -1
	length = $mapColorOptions.length
	
	while ++iterator < length
		$node = $mapColorOptions[ iterator ]
		
		if 0 is $node.id.indexOf 'map-color-' + color
			$node.checked = true
		else
			$node.checked = false
	
	color

# rendererOptions = app.options.directionsRenderer
# rendererOptions.polylineOptions = app.options.polylineOptions

mapView = app.mapView = new MapView ( $$ '#map-canvas' ),
	'zoom' : 14
	'center' : new google.maps.LatLng 52.359903, 4.884131
	'disableDefaultUI' : true

mapView.setMapStyles app.options.mapStyles
mapView.setIcons app.options.icons
mapView.setRenderer app.options.directionsRenderer
mapView.setPolylineOptions app.options.polylineOptions
mapView.setService null
mapView.setRouteBoxer new RouteBoxer
app.setMapStyle settingsManager.get 'map-color'

window.on 'click', ( event ) ->
	
	$target = event.target
	
	if not $target.classList.contains 'route-info-clear' then return
	
	do event.preventDefault
	do event.stopPropagation
	
	$routeInfo.classList.remove 'active'
	
	data = do app.dataManager.getPointsAsArray
	do app.mapView.clear
	
	app.mapView.renderPoints data, true
	
	return

REGEXP_CURRENT_LOCATION = /huidige locatie/i

# When the user selects the button to plan a route...
$planRoute.on 'click', ( event ) ->
	
	# Prevent default action, and stop the event from bubbling up.
	do event.preventDefault
	do event.stopPropagation
	
	$planRoute.classList.add 'loading'
	
	# Set origin and destination based on input.
	origin = $planFrom.value
	destination = $planTo.value
	
	# Set initial distance to 500 meters.
	distance = 0.5
	
	# If origin and/or destination are empty, set them to current location.
	origin or origin = 'Huidige locatie'
	destination or destination = 'Huidige locatie'
	
	callback = ( route ) ->
		if route.error
			alert "Sorry. Er trad een fout op in de applicatie: #{route.error}"
			console.log 'ERROR!', arguments
		else
			app.mapView.renderRoute route
			do planner.hide
		
		$routeInfo.innerHTML = app.routeToInfoString route
		$routeInfo.classList.add 'active'
		
		$planRoute.classList.remove 'loading'
		
		return
	
	# When origin and/or destination are based on the users current location, 
	# request the location from `locationManager`, and calculate a route based 
	# on the given position.
	if REGEXP_CURRENT_LOCATION.test( origin ) or REGEXP_CURRENT_LOCATION.test( destination )
		app.locationManager.once ( position ) ->
			coords = [ position.coords.latitude, position.coords.longitude ]
			
			if REGEXP_CURRENT_LOCATION.test origin
				origin = coords
			
			if REGEXP_CURRENT_LOCATION.test destination
				destination = coords
			
			app.mapView.requestRoute origin, destination, distance, callback
	# Else, emediatly request a route.
	else
		app.mapView.requestRoute origin, destination, distance, callback
	
	undefined

# When the user selects an element...
window.on 'click', ( event ) ->
	
	$target = event.target
	
	# Return if it's not one of the `uitgestippeld` items, return.
	unless $target.classList.contains 'uitgestippeld-link'
		$parent = $target.parentElement
		if $parent.classList.contains 'uitgestippeld-link'
			$target = $parent
		else
			return
	
	# Find the route belonging to the `uitgestippeld` item.
	route = app.dataManager.getRoute $target.dataset.id
	
	# If a route couldn't be found, return.
	unless route then return
	
	# Prevent default action, and stop the event from bubbling up.
	do event.preventDefault
	do event.stopPropagation
	
	$target.classList.add 'loading'
	
	# Draw a new route between all `waypoints` on route, starting at `origin`, 
	# and ending at `destination`.
	app.mapView.calculateRoute route.waypoints, route.origin.latLng, route.destination.latLng, ( route ) ->
		$target.classList.remove 'loading'
		
		if route.error
			alert "Sorry. Er trad een fout op in de applicatie: #{route.error}"
			console.log 'ERROR!', arguments
		else
			app.mapView.renderRoute route
			
			# Hide the planner.
			do planner.hide
			
			$routeInfo.innerHTML = app.routeToInfoString route
			$routeInfo.classList.add 'active'
			
			# Hide `uitgestippeld`.
			$uitgestippeld.classList.remove 'active'

	undefined


# Initialization.

# Instanciate the uitgestippeld modals as 
# carousels.
new Carousel $uitgestippeldCarousel, true

# Instanciate planner.
planner = new Planner $planner

# Hide startup-image after 0.5s.
window.setTimeout ( -> $startupImage.classList.add 'hidden' ), 500

$w1 = $$ '.walkthrough-modal .p1'
$w2 = $$ '.walkthrough-modal .p2'
$w3 = $$ '.walkthrough-image'
$w4 = $$ '.walkthrough-modal .p3'
$w5 = $$ '.walkthrough-end'

# Activate walkthrough modal after 0.8ms.
window.setTimeout ->
		$walkthrough.classList.add 'active'
	, 1000

window.setTimeout ->
		$w1.classList.remove 'hidden'
	, 1800

window.setTimeout ->
		$w2.classList.remove 'hidden'
	, 2600

window.setTimeout ->
		$w3.classList.remove 'hidden'
	, 3400

window.setTimeout ->
		$w4.classList.remove 'hidden'
	, 4200

window.setTimeout ->
		$w5.classList.remove 'hidden'
	, 5000

$w5.on 'click', ->
	# Activate map modal after 1s
	do planner.show
	$planner.style.height = '100%'
	$map.classList.add 'active'
	do app.mapView.clear
	app.mapView.renderPoints app.dataManager.getPointsAsArray(), true

# Remove startup-image after 1.1ms
window.setTimeout ( -> $startupImage.style.display = 'none' ), 1100

# Request geolocation on load.
window.on 'load', -> do app.locationManager.request

$mapColorOptions.on 'change', ( event ) ->
	$target = event.target
	app.setMapStyle $target.value
	
	return
