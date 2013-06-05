# Store scope; probably `window`.
exports = @

app = exports.app or exports.app = {}

app.dataManager = new DataManager
app.dataManager.setPoints app.data
app.dataManager.setRoutes app.route

$planner                = $$ '.planner'
$planRoute              = $$ '#plan-route'
$planTo                 = $$ '#plan-route-to'
$planFrom               = $$ '#plan-route-from'
$info                   = $$ '.info-modal'
$uitgestippeld          = $$ '.uitgestippeld-modal'
$walkthroughCarousel    = $$ '.walkthrough-modal .carousel'
# $meestermatcherCarousel = $$ '.meestermatcher-modal .carousel'
$uitgestippeldCarousel  = $$ '.uitgestippeld-modal .carousel'

app.pointToString = ( point ) ->
	"""
		<header class=\"bar-title\">
			<h3 class=\"title\"><div class="overflow-wrapper">#{point.piece}</div></h3>
			<a class=\"button\" href=\"#info-modal\">
				Close
			</a>
		</header>
		<div class=\"content\">
			<div class=\"img\" style=\"background-image:url(./asset/image/data/#{point.info.id}_large.jpg)\">
				<img class=\"hidden\" alt=\"\" src=\"./asset/image/data/#{point.info.id}_large.jpg\">
			</div>
			<div class=\"info-wrapper\">
				<h1>#{point.info.title}</h1>
				<h2>#{point.artist}</h2>
				<p>#{point.info.description}</p>
				<a class=\"button-primary button-block button-large\" href=\"#{point.link}\">Op naar het Rijks!</a>
			</div>
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


# Request geolocation on load.
window.on 'load', -> do app.locationManager.request

# When the user selects the button to plan a route...
$planRoute.on 'click', ( event ) ->
	
	# Prevent default action, and stop the event from bubbling up.
	do event.preventDefault
	do event.stopPropagation
	
	$planRoute.classList.add 'loading'
	
	# Set origin and destination based on input.
	origin = do $planFrom.value.toLowerCase
	destination = do $planTo.value.toLowerCase
	
	# Set initial distance to 500 meters.
	distance = 0.5
	
	# If origin and/or destination are empty, set them to current location.
	origin or origin = 'huidige locatie'
	destination or destination = 'huidige locatie'
	
	callback = ( error ) ->
		if error
			alert "Sorry. Er trad een fout op in de applicatie: #{error}"
			console.log 'ERROR!', arguments
		else
			do planner.hide
		
		$planRoute.classList.remove 'loading'
		
		return
	
	# When origin and/or destination are based on the users current location, 
	# request the location from `locationManager`, and calculate a route based 
	# on the given position.
	if origin is 'huidige locatie' or destination is 'huidige locatie'
		app.locationManager.once ( position ) ->
			coords = [ position.coords.latitude, position.coords.longitude ]
			if origin is 'huidige locatie' then origin = coords
			if destination is 'huidige locatie' then destination = coords
			app.mapView.requestRoute origin, destination, distance, callback
	# Else, emediatly request a route.
	else
		app.mapView.requestRoute origin, destination, distance, callback
	
	undefined

# When the user selects an element...
window.on 'click', ( event ) ->
	
	$target = event.target
	
	# Return if it's not one of the `uitgestippeld` items, return.
	unless $target.classList.contains 'uitgestippeld-link' then return
	
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
	app.mapView.calculateRoute route.waypoints, route.origin.latLng, route.destination.latLng, ( error ) ->
		if error
			alert "Sorry. Er trad een fout op in de applicatie: #{error}"
			console.log 'ERROR!', arguments
		else
			
			$target.classList.remove 'loading'
			
			# Hide the planner.
			do planner.hide
			
			# Hide `uitgestippeld`.
			$uitgestippeld.classList.remove 'active'

	undefined


# Initialization.

# Instanciate the walkthrough and uitgestippeld modals as 
# carousels.
new Carousel $walkthroughCarousel, true
# new Carousel $meestermatcherCarousel, true
new Carousel $uitgestippeldCarousel, true

# Instanciate planner.
planner = new Planner $planner

# Show the planner.
do planner.show

# Overwrite height.
$planner.style.height = '100%'


