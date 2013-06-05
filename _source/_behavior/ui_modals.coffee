exports = @

getTargets = ( $target ) ->
	# Select all anchor tags as possible popovers.
	$modals = $ 'a'

	# Loop, starting at `$target`, cycling up through its parents, and break 
	# when `document` is reached.
	while $target and $target isnt document

		# Loop through all previously selected anchor tags, return when one of 
		# them matches the current element.
		iterator = -1
		length = $modals.length

		while ++iterator < length
			if $modals[ iterator ] is $target
				return $target
		
		$target = $target.parentNode

	return

window.on 'click', ( event ) ->
	# Detect the event targeted a popover.
	$anchor = getTargets event.target
	
	# Return if no anchor was found.
	if not $anchor or not $anchor.hash then return

	# Prevent the default browser action.
	do event.preventDefault
	
	# Prevent the event from bubbling up.
	do event.stopPropagation
	
	# Select the linked modal.
	$modal = do ( $ $anchor.hash ).item
	
	# Toggle `active`.
	if $modal then $modal.classList.toggle 'active'
	
	return
