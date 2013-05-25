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
	console.warn "ERROR(#{error.code}): #{error.message}"
	
	@


locationManager = app.locationManager = new LocationManager


###
Plan-my-route modal.
###

$planRouteModal = do ( $ '#plan-route-modal' ).item

# Show/hide.

exports.home = home = ( boolean ) ->
	boolean is !!boolean or boolean = !$planRouteModal.classList.contains 'active'
	
	if boolean then $planRouteModal.classList.add 'active'
	else $planRouteModal.classList.remove 'active'

$planRoute = do ( $ '#plan-route' ).item
$planTo = do ( $ '#plan-route-to' ).item
$planFrom = do ( $ '#plan-route-from' ).item


window.on 'load', -> do locationManager.request


$planRoute.on 'click', ( event ) ->
	
	origin = $planFrom.value
	destination = $planTo.value
	
	if origin is '' and destination is ''
		# Error message?
		return
	else if 'huidige locatie' is do origin.toLowerCase
		listener = ( position ) ->
			coords = [ position.coords.latitude, position.coords.longitude ]
			home false
			calcRoute coords, destination
			locationManager.off listener
		
		locationManager.on listener
	else
		home false
		calcRoute origin, destination
		
# do home

# Actions

# $planRouteModal = do ( $ '#plan-route-modal' ).item
# 
# exports.home = home = ( boolean ) ->
# 	boolean is !!boolean or boolean = !$planRouteModal.classList.contains 'active'
# 	
# 	if boolean then $planRouteModal.classList.add 'active'
# 	else $planRouteModal.classList.remove 'active'
# 
# do home
