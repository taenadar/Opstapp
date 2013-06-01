###
Here be coffee
###

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

$planRouteModal = do ( $ '#plan-route-modal' ).item

# Show/hide.


$planner = $$ '.planner'
$planRoute = $$ '#plan-route'
$planTo = $$ '#plan-route-to'
$planFrom = $$ '#plan-route-from'

window.on 'load', -> do locationManager.request

$planRoute.on 'click', ( event ) ->
	
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


window.on 'click', ( event ) ->
	$target = event.target
	
	if $target.classList.contains 'button-map'
		do event.preventDefault
		do event.stopPropagation
		
		id = $target.dataset.id
		if id is 'undefined' then id = null
		waypoint = waypoints[ id ]
		
		unless id or waypoint then return
		
		$infoModal.innerHTML = waypointToString waypoint
		info true
	
	return

	
$walkthrough = $$ '.walkthrough-modal .carousel'
carousel = new Carousel $walkthrough, true

$meestermatcher = $$ '.meestermatcher-modal .carousel'
meestermatcher = new Carousel $meestermatcher, true

planner = new Planner $planner
do planner.show

# Overwrite height.
$planner.style.height = '100%'

exports.planner = planner
