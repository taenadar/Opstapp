getTargets = ( $target ) ->
	$popovers = $ '.toggle'

	while $target and $target isnt document

		iterator = -1
		length = $popovers.length

		while ++iterator < length
			if $popovers[ iterator ] is $target
				return $target
		
		$target = $target.parentNode

	return

window.on 'click', ( event ) ->
	$toggle = getTargets event.target

	if not $toggle then return

	do event.preventDefault
	do event.stopPropagation

	$toggle.classList.toggle 'active'
	
	return
