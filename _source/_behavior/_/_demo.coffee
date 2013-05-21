###

Code to run the demo: The Opstapp User Interface Library.

###

# helpers.

helpers = {}

helpers.escapeHTML = ( html ) ->
	String( html ).replace( /&/g, "&amp;" ).replace( /</g, "&lt;" ).replace( />/g, "&gt;" ).replace( /\"/g, "&quot;" )

REGEXP_INDENT = /(  )+/
REGEXP_TAB = /\t/g
REGEXP_WHITESPACE = /\s+/g

STRING_DOUBLESPACE = '  '
STRING_NEWLINE = '\n'

# Select all views.
$views = document.querySelectorAll '.view'

# Get the code content of each $phone, and place it under $description.
iterator = -1
length = $views.length

while ++iterator < length
	$view = $views[ iterator ]

	$content = $view.querySelector '.phone-inner'
	
	$description = $view.querySelector '.description'

	$code = document.createElement 'code'
	$pre = document.createElement 'pre'

	content = helpers.escapeHTML( $content.innerHTML )

	content = content.replace REGEXP_TAB, STRING_DOUBLESPACE
	indent = REGEXP_INDENT.exec( content )[ 0 ]

	contents = content.split STRING_NEWLINE
	results = []

	Array::forEach.call contents, ( string, i ) ->
		if string.replace( REGEXP_WHITESPACE, '' ) isnt ''
			results.push string.replace indent, ''

	$code.innerHTML = results.join STRING_NEWLINE

	$pre.appendChild $code
	$description.appendChild $pre

	$nodes = document.querySelectorAll 'pre > code'

	l = $nodes.length;
	i = -1;

	while ++i < l
		$nodes[ i ].classList.add 'language-markup'
		Prism.highlightElement $nodes[i]
