exports = @

Carousel = ( $node, insertController ) ->
	
	@$node = $node
	@$container = $node.$$ '.carousel-list'
	@$panes = $node.$ '.carousel-list > li'
	
	@paneWidth = 0
	@paneCount = @$panes.length
	@paneCurrent = 0
	
	if insertController
		@$controller = $controller = document.createElement 'ul'
		$controller.classList.add 'carousel-controller'
		items = []
		
		iterator = -1
		length = @paneCount
		
		while ++iterator < length
			items[ iterator ] = """
				<li><a href="#" data-id="#{iterator}">#{iterator + 1}</a></li>
				"""
		
		$controller.innerHTML = items.join ''
		
		@$items = $controller.$ 'li'
		$item = $controller.$$ "[data-id='#{@paneCurrent}']"
		$item.parentElement.classList.add 'active'
		
		$node.appendChild $controller
	
	$hammer = Hammer $node,
		'drag_lock_to_axis' : true
	
	$hammer.on 'release dragleft dragright swipeleft swiperight', =>
		@handleHammer.apply @, arguments
	
	@$controller.addEventListener 'click', ( event ) =>
		if 'a' is do event.target.tagName.toLowerCase
			@handleController event
	
	do @setPaneDimensions
	
	handler = => do @setPaneDimensions
	
	window.addEventListener 'load', handler
	window.addEventListener 'resize', handler
	window.addEventListener 'orientationchange', handler
	
	@

Carousel::setPaneDimensions = ->
	
	@paneWidth = @$node.getBoundingClientRect().width
	
	iterator = -1
	length = @paneCount
	
	while ++iterator < length
		@$panes[ iterator ].style.width = @paneWidth + 'px'
	
	@$container.style.width = ( @paneWidth * @paneCount ) + 'px'
	
	@

Carousel::showPane = ( index ) ->
	
	@paneCurrent = Math.max 0, Math.min index, @paneCount - 1
	
	if @$items
		iterator = -1
		length = @$items.length
	
		while ++iterator < length
			@$items[ iterator ].classList.remove 'active'
		
		$item = @$controller.$$ "[data-id='#{@paneCurrent}']"
		$item.parentElement.classList.add 'active'
	
	@setContainerOffset ( 100 / @paneCount ) * -@paneCurrent, true
	
	@

Carousel::setContainerOffset = ( percent, animate ) ->
	
	if animate
		@$container.classList.add 'animate'
	
	if transform = supports 'transform'
		if animate
			@$container.style[ transform  ] = "translate3d(#{percent}%,0,0) scale3d(1,1,1)"
		else
			@$container.style[ transform  ] = "translate3d(#{percent}%,0,0) scale3d(0.95,0.95,1)"
	else
		@$container.style.left = "#{percent * @paneCount}%"
	
	unless animate
		@$container.classList.remove 'animate'
	
	@

Carousel::next = -> @showPane @paneCurrent + 1, true
	
Carousel::prev = -> @showPane @paneCurrent - 1, true

Carousel::handleController = ( event ) ->
	
	$target = event.target
	id = +$target.dataset.id
	
	do event.preventDefault
	do event.stopPropagation
	
	@showPane id, true
	
	@

Carousel::handleHammer = ( event ) ->
	
	# disable browser scrolling
	do event.gesture.preventDefault
	
	type = event.type
	direction = event.gesture.direction

	if type is 'dragright' or type is 'dragleft'
		
		# stick to the finger.
		offsetPane = ( 100 / @paneCount ) * -@paneCurrent
		offsetDrag = ( ( 100 / @paneWidth ) * event.gesture.deltaX ) / @paneCount

		# slow down at the first and last pane.
		if ( @paneCurrent is 0 and direction is Hammer.DIRECTION_RIGHT ) or ( @paneCurrent is @paneCount - 1 and direction is Hammer.DIRECTION_LEFT )
			offsetDrag *= 0.4

		@setContainerOffset offsetDrag + offsetPane
	
	else if type is 'swipeleft'
		
		do @next
		do event.gesture.stopDetect

	else if type is 'swiperight'
		
		do @prev
		do event.gesture.stopDetect

	else if type is 'release'
		
		# more then 50% moved, navigate.
		if @paneWidth / 2 < Math.abs event.gesture.deltaX
			if direction is 'right'
				do @prev
			else
				do @next
		else
			@showPane @paneCurrent, true
	
	@

exports.Carousel = Carousel