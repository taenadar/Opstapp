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

LocationManager::off = ( listener ) ->
	
	iterator = -1
	length = @listeners.length
	
	while ++iterator < length
		if @listeners[ iterator ] is listener
			delete @listeners[ iterator ]
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

exports.home = home = ( boolean ) ->
	boolean is !!boolean or boolean = !$planRouteModal.classList.contains 'active'
	
	$planRouteModal.classList[ if boolean then 'add' else 'remove' ] 'active'
	
	$planRouteModal

$planRoute = do ( $ '#plan-route' ).item
$planTo = do ( $ '#plan-route-to' ).item
$planFrom = do ( $ '#plan-route-from' ).item
$planDistance = do ( $ '#plan-route-distance' ).item


window.on 'load', -> do locationManager.request


$planRoute.on 'click', ( event ) ->
	
	origin = $planFrom.value
	destination = $planTo.value
	distance = parseFloat $planDistance.value
	
	if origin is '' and destination is ''
		alert 'Een begin- en eindpunt moet aanwezig zijn om een route te plannen'
		return
	else if 'huidige locatie' is do origin.toLowerCase
		listener = ( position ) ->
			coords = [ position.coords.latitude, position.coords.longitude ]
			home false
			calcRoute coords, destination, distance
			locationManager.off listener
		
		locationManager.on listener
	else
		home false
		calcRoute origin, destination, distance

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
			<h3 class=\"title\">
				#{data.piece}
			</h3>
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