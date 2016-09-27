var path    = require('path');
var extname = require('path').extname;
var MagicString = require('magic-string');
var sander = require('sander');
var mapSeries = require('promise-map-series');

module.exports = include;

// Borrowed from gobble-replace
var NO_MATCH = {};
var hasProp = {}.hasOwnProperty;
function getValue ( obj, key ) {
	if ( !hasProp.call( obj, key ) ) {
		return '';
	}
	obj = obj[ key ];
	return obj;
}

// Borrowed from gobble-replace
function escapeSpecials ( str ) {
	return str.replace( /\\/g, '//' ).replace( /[\.\+\*\?\[\^\]\$\(\)\{\}\!\|\:\-]/g, function ( match ) {
		return '\\' + match;
	});
}



function include(inputdir, outputdir, options) {

	var includedFiles = [];
	var delimiters = options.delimiters ? options.delimiters : ["include('", "')"];
	delimiters = delimiters.map(escapeSpecials);
	var pattern = new RegExp( delimiters[0] + '\\s*([^\\s]+?)\\s*' + delimiters[1], 'g' );
	var fileContents = {};

	return sander.lsr( inputdir ).then( function ( filenames ) {
		return mapSeries( filenames, function ( filename ) {
			return sander.readFile(inputdir, filename).then(function(code){
				fileContents[ filename ] = code.toString();
			});
		}).then( function() {
			return mapSeries( filenames, function ( filename ) {

				var ext = extname( filename );
				var sourceMap = 'sourceMap' in options ? options.sourceMap : ( ext === '.js' || ext === '.css' );
				var code = fileContents[filename];
				var inputFilename = path.resolve(inputdir, filename);
				var inputFileStats = sander.lstatSync();
				if (inputFileStats.isSymbolicLink()) {
					inputFilename = sander.readlinkSync(inputFilename);
				}
				var outputFilename = path.resolve(outputdir, filename);

// 				console.log('gobble-include: ', filename);
				if ( sourceMap ) {
					/// TODO: Load existing source map, if any.
					var magicString = new MagicString( code );

					while ( match = pattern.exec( code ) ) {
						var value = getValue(fileContents, match[1] );

						if ( value !== NO_MATCH ) {
// 							console.log('Included ', match[1]);
							includedFiles.push(match[1]);

							magicString.overwrite( match.index, match.index + match[0].length, value );
						}
					}

					var sourceMapping = '';
					if (ext === '.css') {
						sourceMapping = '\n/*# sourceMappingURL=' + outputFilename + '.map */';
					} else {
						sourceMapping = '\n//# sourceMappingURL=' + outputFilename + '.map';
					}

					// Write files (source + map)
					return sander.writeFile( outputFilename, magicString.toString() + sourceMapping).then(function() {
						return sander.writeFile( outputFilename + '.map',
							magicString.generateMap({
								file: outputFilename,
								source: inputFilename,
								hires: true
							}).toString()
						);
					});

				} else {
					code = code.replace( pattern, function ( match, $1 ) {
// 						console.log('Included ', $1);
						includedFiles.push($1);
						var value = getValue( fileContents, $1 );
						return value !== NO_MATCH ? value : match;
					});
					return sander.writeFile( outputdir, filename, code);
				}
			}).then( function() {
				return mapSeries( includedFiles, function ( filename ) {

// 					console.log('Deleting: ', filename);
					if (sander.existsSync(outputdir, filename + '.map')) {
						sander.unlinkSync(outputdir, filename + '.map');
					}
					if (sander.existsSync(outputdir, filename)) {
						sander.unlinkSync(outputdir, filename);
					}

// 					return sander.unlink(outputdir, filename + '.map')
// 						.then(sander.unlink(outputdir, filename));

				});
			});
		});
	});
};


include.defaults = {
//	delimiters: ["include('", "')"],
	// we only want to use this function with text files - not binaries (images etc)
	accept: 'html svg txt md hbs json cson xml yml js coffee ts css scss sass'.split( ' ' ).map( function ( ext ) { return '.' + ext; })
//	sourceMap: true | false
};







