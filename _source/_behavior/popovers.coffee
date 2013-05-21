getTargets = ( $target ) ->
	$popovers = $ 'a'

	while $target and $target isnt document

		iterator = -1
		length = $popovers.length

		while ++iterator < length
			if $popovers[ iterator ] is $target
				return $target
		
		$target = $target.parentNode

	return

onPopoverHidden = () ->
	document.body.removeChild $backdrop
	popover.style.display = 'none'
	popover.removeEventListener 'webkitTransitionEnd', onPopoverHidden

$backdrop = do () ->
	$node = document.createElement 'div'

	$node.classList.add 'backdrop'

	$node.on 'touchend', () ->
		popover.on 'webkitTransitionEnd', onPopoverHidden
		popover.classList.remove 'visible'

	$node

window.on 'click', ( event ) ->
	$anchor = getTargets event.target

	if not $anchor or not $anchor.hash then return

	$popover = do ( $ $anchor.hash ).item

	if not $popover or not $popover.classList.contains 'popover' then return

	do event.preventDefault
	do event.stopPropagation

	$popover.style.display = 'block'
	$popover.classList.add 'visible'

	$popover.parentNode.appendChild $backdrop
