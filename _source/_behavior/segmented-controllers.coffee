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

###
	Meestermatcher
###

$meestermatcherController = $ '.meestermatcher-controller'
$meestermatcherList = $ '.meestermatcher-list'
currentMeesterMatcherItem = 1
meestermatcherListItemCount = $meestermatcherList.item().childElementCount

changeActiveScreen = ( index ) ->
	if index < 1
		return
	
	if index > meestermatcherListItemCount
		alert index
		return
	
	actives = $meestermatcherController.$ '.active'
	actives = actives.concat $meestermatcherList.$ '.active'
	
	length = actives.length
	iterator = -1
	
	while ++iterator < length
		actives[ iterator ].classList.remove 'active'
	
	$newActiveItem = $meestermatcherList.$$ '#step' + index
	$newActiveControler = $meestermatcherController.$$ '[href="#step' + index + '"]'
	
	$newActiveItem.classList.add 'active'
	$newActiveControler.parentElement.classList.add 'active'
	
	currentMeesterMatcherItem = index
	
	# currentMeesterMatcherItem = index + 1
	
	undefined



$meestermatcherController.item().on 'click', ( event ) ->
	
	if 'a' isnt event.target.tagName.toLowerCase() then return
	
	hash = event.target.hash
	index = +hash.slice 5
	
	do event.preventDefault
	do event.stopPropagation
	
	changeActiveScreen index


$el = do ( $ '#meestermatcher-modal .content' ).item

Hammer( $el ).on 'swipeleft', ( event ) ->
	
	do event.preventDefault
	do event.stopPropagation
	
	changeActiveScreen currentMeesterMatcherItem + 1
	
	undefined

Hammer( $el ).on 'swiperight', ->
	
	do event.preventDefault
	do event.stopPropagation
	
	changeActiveScreen currentMeesterMatcherItem - 1
	
	undefined


###
	Intro
###

