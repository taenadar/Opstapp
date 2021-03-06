exports = @

Planner = ( $node, insertController ) ->
	
	@$node = $node
	@height = window.innerHeight
	@nodeHeight = $node.getBoundingClientRect().height
	
	$hammer = Hammer $node,
		'drag_lock_to_axis' : true
	
	$hammer.on 'touch swipedown swipeup dragup dragdown release', =>
		
		@handleHammer.apply @, arguments
	
	@

Planner::setContainerOffset = ( delta, animate ) ->
	
	@$node.classList[ if animate then 'add' else 'remove' ] 'animate'
	
	if delta > 0
		delta = ( delta * 0.3 )
	else if delta < -@nodeHeight
		delta = -@nodeHeight + ( ( @nodeHeight + delta ) * 0.3 )
	
	offset = ( -delta / @height ) * 100
	
	@$node.style.bottom = "#{100 - offset}%"
	
	@

Planner::show = ->
	
	@setContainerOffset -@nodeHeight, true
	
	if @onshow
		@onshow @
	
	@

Planner::hide = ->
	
	@setContainerOffset 0, true
	
	if @onhide
		@onhide @
	
	@

Planner::handleHammer = ( event ) ->
	
	# Dont catch on children.
	if event.target isnt @$node then return
	
	# disable browser scrolling
	do event.gesture.preventDefault
	do event.preventDefault
	
	type = event.type
	direction = event.gesture.direction

	if type is 'dragup' or type is 'dragdown'
		@setContainerOffset -1 * event.gesture.center.pageY
	else if type is 'swipedown'
		do @show
	else if type is 'swipeup'
		do @hide
	else if type is 'release'
		
		if @nodeHeight / 2 < Math.abs event.gesture.deltaY
			if direction is 'up' then do @hide else do @show
		else
			do @show
	
	@


exports.Planner = Planner