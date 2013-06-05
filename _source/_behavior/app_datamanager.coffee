# Store scope; probably `window`.
exports = @

DataManager = ->
	
DataManager::getPoint = ( id ) ->
	@_points[ id ] or false

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

location

DataManager::getPoints = ->
	@_points or false

DataManager::getPointsAsArray = ->
	result = []
	
	result.push prop for key, prop of @_points
	
	result

DataManager::clearPoint = ( id ) ->
	point = @_points[ id ]
	@_points[ id ] = null
	
	point

DataManager::clearPoints = ->
	points = @_points
	@_points = {}
	
	points

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

DataManager::setPoints = ( points ) ->
	
	@_points or @_points = {}
	
	iterator = -1
	length = points.length
	
	@setPoint points[ iterator ] while ++iterator < length
	
	@

DataManager::getRoute = ( id ) ->
	@_routes[ id ] or false

DataManager::getRoutes = ->
	@_routes or false

DataManager::getRoutesAsArray = ->
	result = []
	
	result.push prop for key, prop of @_routes
	
	result


DataManager::clearRoute = ( id ) ->
	route = @_routes[ id ]
	@_routes[ id ] = null
	
	route

DataManager::clearRoutes = ->
	routes = @_routes
	@_routes = {}
	
	routes

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

DataManager::setRoutes = ( routes ) ->
	
	@_routes or @_routes = {}
	
	iterator = -1
	length = routes.length
	
	@setRoute routes[ iterator ] while ++iterator < length
	
	@

exports.DataManager = DataManager