# Store scope; probably `window`.
exports = @

# Constructor.
DataManager = ->

# Return one point (by ID).
DataManager::getPoint = ( id ) ->
	@_points[ id ] or false

# Return one point (by location).
DataManager::getPointByLocation = ( location ) ->
	
	if location.id
		return @getPoint location.id
	
	points = do @getPointsAsArray
	
	iterator = -1
	length = points.length
	
	while ++iterator < length
		point = points[ iterator ]
		
		if point.latLng.equals location then return point
	
	false

# Return an object containing all points, accessible through their ID.
DataManager::getPoints = ->
	@_points or false

# Return an array containing all points.
DataManager::getPointsAsArray = ->
	result = []
	
	result.push prop for key, prop of @_points
	
	result

# Remove a point (by ID).
DataManager::clearPoint = ( id ) ->
	point = @_points[ id ]
	@_points[ id ] = null
	
	point

# Remove multiple points.
DataManager::clearPoints = ->
	points = @_points
	@_points = {}
	
	points

# Set a point.
DataManager::setPoint = ( point ) ->
	
	unless point.info and point.info.id then return false
	
	point.isPoint = true
	point.latLng = new google.maps.LatLng point.latitude, point.longitude
	point.latLng.id = point.info.id
	
	point.waypoint =
		'location' : point.latLng
		'stopover' : true
	
	@_points[ point.info.id ] = point
	
	@

# Set multiple points, taking an array containing multiple points.
DataManager::setPoints = ( points ) ->
	
	@_points or @_points = {}
	
	iterator = -1
	length = points.length
	
	@setPoint points[ iterator ] while ++iterator < length
	
	@

# Return a route (by ID).
DataManager::getRoute = ( id ) ->
	@_routes[ id ] or false

# Return an object containing all route, accessible through their ID.
DataManager::getRoutes = ->
	@_routes or false

# Return an array containing all routes.
DataManager::getRoutesAsArray = ->
	result = []
	
	result.push prop for key, prop of @_routes
	
	result

# Remove a route (by ID)
DataManager::clearRoute = ( id ) ->
	route = @_routes[ id ]
	@_routes[ id ] = null
	
	route

# Remove all routes.
DataManager::clearRoutes = ->
	routes = @_routes
	@_routes = {}
	
	routes

# Set a route.
DataManager::setRoute = ( route ) ->
	
	points = []
	iterator = -1
	points_ = route.route
	length = points_.length
	
	while ++iterator < length
		point_ = @getPoint points_[ iterator ].id
		
		if point_ then points.push point_
	
	route_ =
		'image' : route.image
		'name' : route.name
		'description' : route.description
		'origin' : points[ 0 ]
		'destination' : points[ points.length - 1 ]
		'waypoints' : []
	
	points = route_.points = points.slice 1, points.length - 1
	
	iterator = -1
	length = points.length
	route_.waypoints.push points[ iterator ].waypoint while ++iterator < length
	
	@_routes[ route.id ] = route_
	
	@

# Set multiple routes, taking an array containing multiple routes.
DataManager::setRoutes = ( routes ) ->
	
	@_routes or @_routes = {}
	
	iterator = -1
	length = routes.length
	
	@setRoute routes[ iterator ] while ++iterator < length
	
	@

# Exports constructor.
exports.DataManager = DataManager