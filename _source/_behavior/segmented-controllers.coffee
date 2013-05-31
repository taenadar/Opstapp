exports = @

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

