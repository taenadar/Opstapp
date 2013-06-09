# Store scope; probably `window`.
exports = @

# Storage to use.
storage = window.localStorage or window.sessionStorage or false

# Throw an error if (localStorage|sessionStorage) isn't available.
if not storage
	throw new Error """
		Neither sessionStorage, nor localStorage is available, but one should be.
		"""

# Throw an error if JSON isn't available.
if not 'JSON' of window
	throw new Error """
		JSON is not available, but should be.
		"""

SettingsManager = ->
	
	@defaults = {}
	
	@

# Namespace to use in storage.
SettingsManager::namespace = 'opstapp.setting.'

# Set a default value for when a key isn't set in storage.
SettingsManager::setDefault = ( name, value ) ->
	
	@defaults[ @namespace + name ] = value
	
	value

# Get a default value.
SettingsManager::getDefault = ( name ) ->
	
	@defaults[ @namespace + name ]

# Remove a default value.
SettingsManager::removeDefault = ( name ) ->
	
	key = @namespace + name
	
	value = @defaults[ key ]
	
	@defaults[ key ] = null
	
	value

# Set an item in storage.
SettingsManager::set = ( name, value ) ->
	
	key = @namespace + name
	value_ = value
	
	try
		value = JSON.stringify value
	catch error
		throw error
	
	storage.setItem key, value
	
	value_

# Get an item in storage, or return the default (if available).
SettingsManager::get = ( name ) ->
	
	key = @namespace + name
	value = storage.getItem key
	
	if value
		try
			value = JSON.parse value
		catch error
			throw error
	
	value or @getDefault name

# Ret an item in storage.
SettingsManager::remove = ( name ) ->
	
	key = @namespace + name
	value = @get key
	
	storage.removeItem key
	
	value

# Remove all items in storage.
SettingsManager::clear = ( name ) ->
	
	for key of storage
		if 0 is key.indexOf @namespace then storage.removeItem key
	
	@

# Exports.
exports.SettingsManager = SettingsManager
