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
