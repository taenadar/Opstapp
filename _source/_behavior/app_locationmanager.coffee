# Store scope; probably `window`.
exports = @

# Constructor, taking an options object.
LocationManager = ( options ) ->
	
	@listeners = []
	
	# Overwrite options if given..
	if options then @options = options
	
	# Bind `this` to `onsuccess` and `onerror`.
	_onsuccess = @onsuccess
	_onerror = @onerror
	@onsuccess = ( => _onsuccess.apply @, arguments )
	@onerror = ( => _onerror.apply @, arguments )
	
	@isRequested = no
	
	@

# Request function. Calls `watchPosition` on `navigator.geolocation`
LocationManager::request = ->
	
	# Make sure `request` gets called only once.
	if @isRequested is yes then return
	
	@isRequested = yes
	if navigator.geolocation
		@id = navigator.geolocation.watchPosition @onsuccess, @onerror, @options
	else @onerror
		'code' : -1
		'message' : 'GEOLOCATION UNAVAILABLE'
	
	@

# Default options for watching position.
LocationManager::options = 
	'enableHighAccuracy' : true
	'maximumAge' : 0

# On success, store position and call `onupdate`
LocationManager::onsuccess = ( position ) ->
	@position = position
	
	do @onupdate
	
	@

# Listen to position updates.
LocationManager::on = ( listener ) ->
	if @position then listener @position
	@listeners.push listener
	@

# Call a listener once.
LocationManager::once = ( listener ) ->
	if @position
		listener @position
		return @
	
	listener_ = ( position ) =>
		listener @position
		@off listener_
	
	@listeners.push listener_
	
	@

# Remove a listener.
LocationManager::off = ( listener ) ->
	
	iterator = -1
	length = @listeners.length
	
	while ++iterator < length
		if @listeners[ iterator ] is listener
			@listeners[ iterator ] = null
			return true
	
	false

LocationManager::listeners = []

# call every listener with the current position.
LocationManager::onupdate = ->
	iterator = -1
	length = @listeners.length
	
	while ++iterator < length
		listener = @listeners[ iterator ]
		if listener and listener.call and listener.apply
			@listeners[ iterator ] @position
	
	@

# Throw error when an error catches.
LocationManager::onerror = ( error ) ->
	
	throw new Error """
			There was an error in LocationManager: #{error.message}.
		"""
	
	@

exports.LocationManager = LocationManager
