exports = @

Planner = ( $node, insertController ) ->
	
	@$node = $node
	@height = window.innerHeight
	@nodeHeight = $node.getBoundingClientRect().height
	
	$hammer = Hammer $node,
		'drag_lock_to_axis' : true
	
	$hammer.on 'swipedown swipeup dragup dragdown release', =>
		@handleHammer.apply @, arguments
	
	@

Planner::setContainerOffset = ( delta, animate ) ->
	
	@$node.classList[ if animate then 'add' else 'remove' ] 'animate'
	
	if delta > 0
		delta = ( delta * 0.3 )
	else if delta < -@nodeHeight
		delta = -@nodeHeight + ( ( @nodeHeight + delta ) * 0.3 )
	
	offset = ( -delta / @height ) * 100
	
	@$node.style.top = "#{100 - offset}%"
	
	@

Planner::show = ->
	
	@setContainerOffset -@nodeHeight, true
	
	@

Planner::hide = ->
	
	@setContainerOffset 0, true
	
	@

Planner::handleHammer = ( event ) ->
	
	# disable browser scrolling
	do event.gesture.preventDefault
	do event.preventDefault
	
	type = event.type
	direction = event.gesture.direction

	if type is 'dragup' or type is 'dragdown'
		@setContainerOffset -( @height - event.gesture.center.pageY )
	else if type is 'swipeup'
		do @show
	else if type is 'swipedown'
		do @hide
	else if type is 'release'
		
		if @nodeHeight / 2 < Math.abs event.gesture.deltaY
			if direction is 'down' then do @hide else do @show
		else
			do @show
	
	@


exports.Planner = Planner