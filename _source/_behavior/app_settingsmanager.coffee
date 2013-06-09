# Store scope; probably `window`.
exports = @

storage = window.localStorage || window.sessionStorage

if not 'JSON' of window
	throw new Error """
		JSON is not available, but should be.
		"""

SettingsManager = ->
	
	@defaults = {}
	
	@
	
SettingsManager::namespace = 'opstapp.setting.'

SettingsManager::setDefault = ( name, value ) ->
	
	@defaults[ @namespace + name ] = value
	
	value

SettingsManager::getDefault = ( name ) ->
	
	@defaults[ @namespace + name ]

SettingsManager::removeDefault = ( name ) ->
	
	key = @namespace + name
	
	value = @defaults[ key ]
	
	@defaults[ key ] = null
	
	value

SettingsManager::set = ( name, value ) ->
	
	key = @namespace + name
	value_ = value
	
	try
		value = JSON.stringify value
	catch error
		throw error
	
	storage.setItem key, value
	
	value_

SettingsManager::get = ( name ) ->
	
	key = @namespace + name
	value = storage.getItem key
	
	if value
		try
			value = JSON.parse value
		catch error
			throw error
	
	value or @getDefault name

SettingsManager::remove = ( name ) ->
	
	key = @namespace + name
	value = @get key
	
	storage.removeItem key
	
	value


SettingsManager::clear = ( name ) ->
	
	for key of storage
		if 0 is key.indexOf @namespace then storage.removeItem key
	
	@

exports.SettingsManager = SettingsManager