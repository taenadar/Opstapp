exports = @

# If `app` isnt available on `exports`, set it as an empty object.
app = exports.app or exports.app = {}

# If `options` isnt available on `app`, set it as an empty object.
app.options or app.options = {}

# Set Google Maps `DirectionRenderer` options.
app.options.renderer =
	'suppressMarkers' : true
	'suppressInfoWindows' : true

# Set Google Maps `Polyline` options.
app.options.polyline =
	'strokeColor' : '#5e99b0'
	'strokeOpacity' : 1
	'strokeWeight' : 5

# Set Google Maps `StyledMapType` options.
app.options.mapStyles =
	'dark' : [
				'elementType': 'geometry',
				'stylers': [
					{ 'visibility': 'on' },
					{ 'color': '#242424' }
				]
			,
				'featureType': 'landscape.man_made',
				'elementType': 'geometry',
				'stylers': [
					{ 'color': '#2f2f2f' },
					{ 'visibility': 'on' }
				]
			,
				'featureType': 'poi',
				'stylers': [
					{ 'visibility': 'off' }
				]
			,
				'featureType': 'road',
				'elementType': 'geometry',
				'stylers': [
					{ 'color': '#151515' },
					{ 'visibility': 'simplified' }
				]
			,
				'elementType': 'labels.text.fill',
				'stylers': [
					{ 'color': '#7e7e80' }
				]
			,
				'elementType': 'labels.text.stroke',
				'stylers': [
					{ 'color': '#000100' },
					{ 'weight': 2 }
				]
			,
				'featureType': 'transit',
				'stylers': [
					{ 'visibility': 'off' }
				]
			,
				'featureType': 'water',
				'stylers': [
					{ 'color': '#1b1b1b' },
					{ 'visibility': 'simplified' }
				]
			,
				'featureType': 'road',
				'elementType': 'labels.icon',
				'stylers': [
					{ 'visibility': 'off' }
				]
			,
				'featureType': 'landscape',
				'elementType': 'labels',
				'stylers': [
					{ 'visibility': 'off' }
				]
			,
				'featureType': 'poi',
				'stylers': [
					{ 'visibility': 'off' }
				]
		]
	'light' : [
				"featureType": "poi",
				"stylers": [
					{ "visibility": "off" }
				]
			,
				"elementType": "labels.text.fill",
				"stylers": [
					{ "color": "#eeeeee" }
				]
			,
				"elementType": "labels.text.stroke",
				"stylers": [
					{ "color": "#000000" },
					{ "weight": 2 }
				]
			,
				"featureType": "road",
				"elementType": "labels.icon",
				"stylers": [
					{ "visibility": "off" }
				]
			,
				"featureType": "landscape",
				"elementType": "labels",
				"stylers": [
					{ "visibility": "off" }
				]
			,
				"elementType": "geometry",
				"stylers": [
					{ "visibility": "on" },
					{ "color": "#8e8e8e" }
				]
			,
				"featureType": "landscape.man_made",
				"elementType": "geometry",
				"stylers": [
					{ "visibility": "on" },
					{ "color": "#858585" }
				]
			,
				"featureType": "road",
				"elementType": "geometry",
				"stylers": [
					{ "visibility": "simplified" },
					{ "color": "#222222" }
				]
			,
				"featureType": "transit",
				"stylers": [
					{ "visibility": "off" }
				]
			,
				"featureType": "water",
				"stylers": [
					{ "visibility": "simplified" },
					{ "color": "#434343" }
				]
			,
				"featureType": "poi",
				"stylers": [
					{ "visibility": "off" }
				]
		]

# Set icons sizes.
app.options.icons =
	'1' :
		'anchor' : [ 15, 44 ]
		'size' : [ 30, 50 ]
		'url' : './asset/image/map/markers/1.png'
	'2' :
		'anchor' : [ 15, 44 ]
		'size' : [ 30, 50 ]
		'url' : './asset/image/map/markers/2.png'
	'3' :
		'anchor' : [ 15, 44 ]
		'size' : [ 30, 50 ]
		'url' : './asset/image/map/markers/3.png'
	'4' :
		'anchor' : [ 15, 44 ]
		'size' : [ 30, 50 ]
		'url' : './asset/image/map/markers/4.png'
	'5' :
		'anchor' : [ 15, 44 ]
		'size' : [ 30, 50 ]
		'url' : './asset/image/map/markers/5.png'
	'6' :
		'anchor' : [ 15, 44 ]
		'size' : [ 30, 50 ]
		'url' : './asset/image/map/markers/6.png'
	'7' :
		'anchor' : [ 15, 44 ]
		'size' : [ 30, 50 ]
		'url' : './asset/image/map/markers/7.png'
	'8' :
		'anchor' : [ 15, 44 ]
		'size' : [ 30, 50 ]
		'url' : './asset/image/map/markers/8.png'
	'a' :
		'anchor' : [ 15, 44 ]
		'size' : [ 30, 50 ]
		'url' : './asset/image/map/markers/a.png'
	'b' :
		'anchor' : [ 15, 44 ]
		'size' : [ 30, 50 ]
		'url' : './asset/image/map/markers/b.png'
	'user' :
		'anchor' : [ 18, 18 ]
		'size' : [ 35, 36 ]
		'url' : './asset/image/map/markers/user.png'
	'default' :
		'anchor' : [ 15, 44 ]
		'size' : [ 30, 50 ]
		'url' : './asset/image/map/markers/default.png'
	
