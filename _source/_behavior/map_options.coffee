exports = @

app = exports.app or exports.app = {}

app.options or app.options = {}

app.options.directionsRenderer =
	'suppressMarkers' : true
	'suppressInfoWindows' : true

app.options.polylineOptions =
	'strokeColor' : '#5e99b0'
	'strokeOpacity' : 0.8
	'strokeWeight' : 3

app.options.mapStyles =
	'dark' : [
			'featureType': 'landscape.natural',
			'stylers': [
					{ 'color': '#3c3c3c' },
					{ 'visibility': 'on' }
				]
			,
				'featureType': 'landscape.man_made',
				'elementType': 'geometry',
				'stylers': [
					{ 'color': '#2f2f2f' },
					{ 'visibility': 'on' }
				]
			,
				'featureType': 'water',
				'elementType': 'geometry',
				'stylers': [
					{ 'visibility': 'on' },
					{ 'color': '#434343' }
				]
			,
				'featureType': 'administrative',
				'elementType': 'geometry',
				'stylers': [
					{ 'visibility': 'on' },
					{ 'color': '#808080' }
				]
			,
				'featureType': 'road',
				'elementType': 'geometry',
				'stylers': [
					{ 'color': '#000000' },
					{ 'visibility': 'on' }
				]
			,
				'featureType': 'transit',
				'stylers': [
					{ 'color': '#4c4c4c' },
					{ 'visibility': 'on' }
				]
			,
				'featureType': 'poi',
				'stylers': [
					{ 'visibility': 'off' }
				]
			,
				'elementType': 'labels',
				'stylers': [
					{ 'visibility': 'off' }
				]
		]

app.options.icons =
	'1' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_1.png'
	'2' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_2.png'
	'3' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_3.png'
	'4' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_4.png'
	'5' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_5.png'
	'6' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_6.png'
	'7' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_7.png'
	'8' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_8.png'
	'a' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_a.png'
	'b' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed_b.png'
	'user' :
		'size' : [ 19, 19 ]
		'url' : './asset/image/map/marker_closed_user.png'
	'default' :
		'size' : [ 20, 35 ]
		'url' : './asset/image/map/marker_closed.png'
	
