getTargets = ( $target ) ->
	$popovers = $ '.segmented-controller li a'

	while $target and $target isnt document

		iterator = -1
		length = $popovers.length

		while ++iterator < length
			if $popovers[ iterator ] is $target
				return $target
		
		$target = $target.parentNode

	return

window.on 'click', ( event ) ->
	className = 'active'
	classSelector = '.' + className
	$target = getTargets event.target

	unless $target then return

	do event.preventDefault
	do event.stopPropagation

	$targetTab = $target.parentNode
	$activeTab = $targetTab.parentNode.$$ classSelector

	# Remove `.active` on the previous tab.
	if $activeTab then $activeTab.classList.remove className

	# Add `.active` on the current tab.
	$targetTab.classList.add className

	unless $target.hash
		throw new Error 'segmentedController: Missing `hash` on $target'
		return

	$targetBody = $$ $target.hash

	unless $targetBody then return

	$activeTabs = $targetBody.parentNode.$ classSelector
	
	iterator = -1
	length = $activeTabs.length
	
	while ++iterator < length
		$node = $activeTabs[ iterator ]
		$node.classList.remove className
	
	$targetBody.classList.add className



$meestermatcherNext = do ( $ '#meestermatcher-next' ).item

$meestermatcherNext.on 'click', ( event ) ->
	hash = $meestermatcherNext.hash
	$target = $$ hash
	
	if not $target then return
	
	$active = $target.parentNode.$$ '.active'
	
	do event.preventDefault
	do event.stopPropagation
	
	# Remove `.active` on the previous tab.
	if $active then $active.classList.remove 'active'

	# Add `.active` on the current tab.
	$target.classList.add 'active'
	
	# Update hash.
	index = +hash.slice 5
	index++
	$meestermatcherNext.hash = '#step' + index
	
	$active_ = $meestermatcherController.$$ '.active'
	$active_.classList.remove 'active'
	$active_.nextElementSibling.classList.add 'active'
		
	return

$meestermatcherController = do ( $ '#meestermatcher-controller' ).item
$meestermatcherControllers = $meestermatcherController.$ '#meestermatcher-controller a'

$meestermatcherController.on 'click', ( event ) ->
	
	if 'a' isnt do event.target.tagName.toLowerCase then return
	
	hash = event.target.hash
	$target = $$ hash
	
	console.log @, @hash
	
	if not $target then return
	
	do event.preventDefault
	do event.stopPropagation
	
	$active = $target.parentNode.$$ '.active'
	$active_ = $meestermatcherController.$$ '.active'
	
	# Remove `.active` on the previous tab.
	if $active then $active.classList.remove 'active'
	if $active_ then $active_.classList.remove 'active'

	# Add `.active` on the current tab.
	$target.classList.add 'active'
	event.target.parentElement.classList.add 'active'
	
	# Update hash.
	index = +hash.slice 5
	index++
	$meestermatcherNext.hash = '#step' + index

	
console.log $meestermatcherController, $meestermatcherControllers
