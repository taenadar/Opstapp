# Store scope; probably `window`.
exports = @

app = exports.app or exports.app = {}


LocationManager = ( options ) ->
	@listeners = []
	
	if options then @options = options
	
	_onsuccess = @onsuccess
	_onerror = @onerror
	@onsuccess = ( => _onsuccess.apply @, arguments )
	@onerror = ( => _onerror.apply @, arguments )
	
	@isRequested = no
	
	@

LocationManager::request = ( position ) ->
	if @isRequested is yes then return
	
	@isRequested = yes
	if navigator.geolocation
		@id = navigator.geolocation.watchPosition @onsuccess, @onerror, @options
	else @onerror
		'code' : -1
		'message' : 'GEOLOCATION UNAVAILABLE'
	
	@

LocationManager::options = 
	'enableHighAccuracy' : true
	'maximumAge' : 0

LocationManager::onsuccess = ( position ) ->
	@position = position
	
	do @onupdate_
	
	@

LocationManager::on = ( listener ) ->
	if @position then listener @position
	@listeners.push listener
	@

LocationManager::once = ( listener ) ->
	if @position
		listener @position
		return @
	
	listener_ = ( position ) =>
		listener @position
		@off listener_
	
	@listeners.push listener_
	
	@

LocationManager::off = ( listener ) ->
	
	iterator = -1
	length = @listeners.length
	
	while ++iterator < length
		if @listeners[ iterator ] is listener
			@listeners[ iterator ] = null
			return true
	
	false

LocationManager::listeners = []

LocationManager::onupdate_ = ->
	iterator = -1
	length = @listeners.length
	
	while ++iterator < length
		listener = @listeners[ iterator ]
		if listener and listener.call and listener.apply
			@listeners[ iterator ] @position
	
	@

LocationManager::onerror = ( error ) ->
	# Fail silently.
	
	@


locationManager = app.locationManager = new LocationManager


###
Plan-my-route modal.
###

# $planRouteModal = do ( $ '#plan-route-modal' ).item
$planner = $$ '.planner'
$planRoute = $$ '#plan-route'
$planTo = $$ '#plan-route-to'
$planFrom = $$ '#plan-route-from'

window.on 'load', -> do locationManager.request

$planRoute.on 'click', ( event ) ->
	
	do event.preventDefault
	do event.stopPropagation
	
	origin = do $planFrom.value.toLowerCase
	destination = do $planTo.value.toLowerCase
	distance = 0.5
	
	origin or origin = 'huidige locatie'
	destination or destination = 'huidige locatie'
	
	callback = ( error ) ->
		if error
			alert "Sorry. Er trad een fout op in de applicatie: #{error}"
			console.log 'ERROR!', arguments
		else
			do planner.hide
	
	if origin is 'huidige locatie' or destination is 'huidige locatie'
		locationManager.once ( position ) ->
			coords = [ position.coords.latitude, position.coords.longitude ]
			if origin is 'huidige locatie' then origin = coords
			if destination is 'huidige locatie' then destination = coords
			calcRoute origin, destination, distance, callback
	else
		calcRoute origin, destination, distance, callback

$infoModal = do ( $ '#info-modal' ).item

exports.info = info = ( boolean ) ->
	boolean is !!boolean or boolean = !$infoModal.classList.contains 'active'
	$infoModal.classList[ if boolean then 'add' else 'remove' ] 'active'
	$infoModal


waypoints = {}

do ->
	iterator = -1
	data = app.data
	length = data.length
	
	while ++iterator < length
		waypoint = data[ iterator ]

		unless waypoint.info and waypoint.info.id then continue
		
		waypoints[ waypoint.info.id ] = waypoint
	
	undefined

waypointToString = ( data ) ->
	"""
		<header class=\"bar-title\">
			<h3 class=\"title\"><div class="overflow-wrapper">#{data.piece}</div></h3>
			<a class=\"button\" href=\"#info-modal\">
				Close
			</a>
		</header>
		<div class=\"content\">
			<div class=\"img\" style=\"background-image:url(#{data.info.image})\">
				<img class=\"hidden\" alt=\"\" src=\"#{data.info.image}\">
			</div>
			<div class=\"info-wrapper\">
				<h1>#{data.info.title}</h1>
				<h2>#{data.artist}</h2>
				<p>#{data.info.description}</p>
				<a class=\"button-primary button-block button-large\" href=\"#{data.link}\">Op naar het Rijks!</a>
			</div>
		</div>
	"""


app.markerIntent = ( event ) ->
	$target = event.target
	
	do event.preventDefault
	do event.stopPropagation
	
	data = event.data
	waypoint = waypoints[ data.id ]
	
	unless data.id or waypoint then return
	
	$infoModal.innerHTML = waypointToString waypoint
	info true
	
	undefined


routes = {}

do ->
	iterator = -1
	data = app.route
	length = data.length
	
	while ++iterator < length
		route = data[ iterator ]
		waypoints_ = []
		
		route_ =
			'image' : route.image
			'name' : route.name
			'description' : route.description
			
		iterator_ = -1
		data_ = route.route
		length_ = data_.length
		
		while ++iterator_ < length_
			waypoint = data_[ iterator_ ]
			
			if waypoint.id and waypoints[ waypoint.id ]
				waypoints_.push waypoints[ waypoint.id ]
		
		route_.origin = waypoints_[ 0 ]
		route_.destination = waypoints_[ waypoints_.length - 1 ]
		route_.waypoints = waypoints_.slice 1, waypoints_.length - 1
		routes[ route.id ] = route_
	
	undefined


window.on 'click', ( event ) ->
	$target = event.target
	
	# while $target isnt document.body
	# 	if $target.classList.contains 'uitgestippeld-link' then break
	# 	
	# 	$target = $target.parentElement
	# 
	unless $target.classList.contains 'uitgestippeld-link' then return
	
	id = $target.dataset.id
	route = routes[ id ]
	
	unless id or route then return
	
	do event.preventDefault
	do event.stopPropagation
	
	iterator = -1
	length = route.waypoints.length
	
	waypoints = []
	
	while ++iterator < length
		waypoint = route.waypoints[ iterator ]
		
		waypoints.push
			'location' : new google.maps.LatLng waypoint.latitude, waypoint.longitude
			'stopover' : true
	
	origin = new google.maps.LatLng route.origin.latitude, route.origin.longitude
	destination = new google.maps.LatLng route.destination.latitude, route.destination.longitude
	
	drawNewRoute waypoints, origin, destination, ->
		console.log 'callback!'
	
	do planner.hide
	$uitgestippeldModal = $$ '.uitgestippeld-modal'
	$uitgestippeldModal.classList.remove 'active'
	
	undefined

# Initialization.
	
$walkthrough = $$ '.walkthrough-modal .carousel'
$meestermatcher = $$ '.meestermatcher-modal .carousel'
$uitgestippeld = $$ '.uitgestippeld-modal .carousel'

carousel = new Carousel $walkthrough, true

meestermatcher = new Carousel $meestermatcher, true

uitgestippeld = new Carousel $uitgestippeld, true

planner = new Planner $planner
do planner.show

# Overwrite height.
$planner.style.height = '100%'


