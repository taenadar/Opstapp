###
Here be coffee
###

# Store scope; probably `window`.
exports = @


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

$planRoute.on 'click', ( event ) ->
	origin = $planTo.value
	destination = $planFrom.value
	if origin is '' and destination is ''
		# Error message?
		return
	
	home false
	calculateRoute origin, destination
		
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
