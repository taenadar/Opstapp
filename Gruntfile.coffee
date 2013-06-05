# grunt-siml-example
# https://github.com/wooorm/grunt-siml-example
# 
# Copyright (c) 2013 wooorm
# Licensed under the MIT license.

module.exports = ( grunt ) ->

	grunt.config.init
		'pkg' : grunt.file.readJSON 'package.json'

		# Metadata.
		'meta' :
			'script' :
				'dist' : './_dist/_behavior/<%= pkg.name %>.js'
				'dist_min' : './_dist/_behavior/<%= pkg.name %>.min.js'
				'banner' : [ '/*! <%= pkg.name %> - v<%= pkg.version %> - ',
					'<%= grunt.template.today("yyyy-mm-dd") %>\n',
					'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>',
					'* Copyright (c) <%= grunt.template.today("yyyy") %> ',
					'<%= pkg.author.name %>; Licensed ',
					'<%= _.pluck(pkg.licenses, "type").join(", ") %> */\n' ].join( '' )
				'banner_min' : [ '/*! <%= pkg.name %> - v<%= pkg.version %> - ',
					'Copyright (c) <%= grunt.template.today("yyyy") %> ',
					'<%= pkg.author.name %>; Licensed ',
					'<%= _.pluck(pkg.licenses, "type").join(", ") %> */\n' ].join( '' )

			'coffee' :
				'source' : './_source/_behavior/*.coffee'

			'javascript' : 
				'source' : './_source/_behavior/*.js'

			'style' : 
				'banner' : '<%= meta.script.banner %>'
				'banner_min' : '<%= meta.script.banner_min %>'
				'dist' : './_dist/_presentation/<%= pkg.name %>.css'
				'dist_min' : './_dist/_presentation/<%= pkg.name %>.min.css'
				'config' : 'config.rb'

			'sass' :
				'source' : [ './_source/_presentation/*.sass', './_source/_presentation/*.scss' ]

			'css' : 
				'source' : './_source/_presentation/*.css'


		# Uglify: Behavior.
		'coffee' :
			'brew' :
				'src' : '<%= meta.coffee.source %>'
				'dest' : '<%= meta.script.dist %>'
				'options' :
					'separator' : ';\n'
		'uglify' :
			'repulsify':
				'src' : '<%= meta.script.dist %>'
				'dest' : '<%= meta.script.dist_min %>'
				'options' :
					'banner' : '<%= meta.script.banner_min %>'

		# Siml: Structure.
		'siml' :
			'parse' :
				'options' : 
					'indent' : '\t'
					'parse' : 'html5'
				'files' :
					'_dist/index.html' : '_source/index.siml'

		# SASS: Presentation.
		'sass' :
			'parse' :
				'options' :
					'compass' : '<%= meta.style.config %>'
				'files' :
					'<%= meta.style.dist %>': '<%= meta.sass.source %>'

		'concat' :
			'behavior':
				'src' : [ '<%= meta.javascript.source %>', '<%= meta.script.dist %>' ]
				'dest' : '<%= meta.script.dist %>'
				'options' :
					'banner' : '<%= meta.script.banner %>'
			'presentation':
				'src' : [ '<%= meta.style.dist %>', '<%= meta.css.source %>' ]
				'dest' : '<%= meta.style.dist %>'
				'options' :
					'banner' : '<%= meta.style.banner %>'

		# !!! Note: There should be an 
		'ftp-deploy' :
			'build' :
				'auth' :
					'host' : 'wooorm.com'
					'port' : 21
					'authKey' : 'wooorm'
				'src' : '_dist'
				'dest' : '/var/www/mi/p/app'

	grunt.registerTask 'copy', 'Copy files to shared dropbox.', () ->
		root = '_dist'
		regexp = new RegExp root + '\/'
		toDir = '../mobile_interaction_shared/_applicatie/2.0.applicatie/'

		grunt.file.recurse root, ( fromPath ) ->
			toPath = fromPath.replace regexp, ''
			toPath = toDir + toPath
			grunt.file.copy fromPath, toPath

	grunt.loadNpmTasks 'grunt-contrib-coffee'
	grunt.loadNpmTasks 'grunt-contrib-uglify'
	grunt.loadNpmTasks 'grunt-contrib-concat'
	grunt.loadNpmTasks 'grunt-contrib-concat'

	grunt.loadNpmTasks 'grunt-siml'
	grunt.loadNpmTasks 'grunt-ftp-deploy'
	grunt.loadNpmTasks 'grunt-contrib-sass'

	grunt.registerTask 'behavior', [ 'coffee:brew', 'concat:behavior', 'uglify:repulsify' ]
	grunt.registerTask 'structure', [ 'siml:parse' ]
	grunt.registerTask 'presentation', [ 'sass:parse', 'concat:presentation' ]

	grunt.registerTask 'produce', [ 'default', 'copy', 'ftp-deploy' ]

	grunt.registerTask 'default', [ 'structure', 'behavior', 'presentation' ]

