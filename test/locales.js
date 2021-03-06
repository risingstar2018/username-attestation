/*jslint node: true */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const findFiles = function(folder, pattern = /.*/, callback) {
	let flist = [];
	fs.readdirSync(folder).map(function(e) {
		let fname = path.join(folder, e);
		let fstat = fs.lstatSync(fname);
		if (fstat.isDirectory()) {
			// don't want to produce a new array with concat
			Array.prototype.push.apply(flist, findFiles(fname, pattern, callback));
		}
		else {
			if (pattern.test(fname)) {
				flist.push(fname);
				if (callback) {
					callback(fname);
				}
			}
		}
	});
	return flist;
};

const compareLineCounts = function(filepath, locale, base) {
	try {
		assert.strictEqual(locale, base);
		console.log('\x1b[32;49mPASS\x1b[39;49m:', filepath, '-', locale, 'lines, just like base file');
	}
	catch (error) {
		console.error('\x1b[31;49mFAIL\x1b[39;49m:', filepath, '-', locale, 'lines while base has', base);
	}
};
const compareMatchingKeys = function(filepath, found, should_have, source, target) {
	try {
		assert.strictEqual(found, should_have);
		console.log('\x1b[32;49mPASS\x1b[39;49m:', filepath, '- all', found, source, 'keys also found in', target);
	}
	catch (error) {
		console.error('\x1b[31;49mFAIL\x1b[39;49m:', filepath, '-', source, 'has', should_have, 'keys, but only', found, 'of them found in', target);
	}
};
const compareBraces = function(filepath, opening, closing, where, type) {
	try {
		assert.strictEqual(opening, closing);
		console.log('\x1b[32;49mPASS\x1b[39;49m:', filepath, '-', opening, type, 'brace pairs in', where);
	}
	catch (error) {
		console.error('\x1b[31;49mFAIL\x1b[39;49m:', filepath, '-', opening, 'opening', type, 'braces and', closing, 'closing', type, 'braces in', where);
	}
};
const compareLineBreaks = function(filepath, locale, base) {
	try {
		assert.strictEqual(locale, base);
		console.log('\x1b[32;49mPASS\x1b[39;49m:', filepath, '-', locale, 'line breaks, just like base file');
	}
	catch (error) {
		console.error('\x1b[31;49mFAIL\x1b[39;49m:', filepath, '-', locale, 'line breaks while base has', base);
	}
};

let base_contents = fs.readFileSync('locales/en.json', 'utf8');
let base_locale = {'data':JSON.parse(base_contents), 'linecount': base_contents.trim().toString().split('\n').length};
let openingBraces = 0;
let closingBraces = 0;
let openingDoubleBraces = 0;
let closingDoubleBraces = 0;
let openingTripleBraces = 0;
let closingTripleBraces = 0;
// compare base locale brace pairs in values
Object.keys(base_locale['data']).forEach(function(key) {
	openingBraces = openingBraces + base_locale['data'][key].split('{').length-1;
	closingBraces = closingBraces + base_locale['data'][key].split('}').length-1;
	openingDoubleBraces = openingDoubleBraces + base_locale['data'][key].split('{{').length-1;
	closingDoubleBraces = closingDoubleBraces + base_locale['data'][key].split('}}').length-1;
	openingTripleBraces = openingTripleBraces + base_locale['data'][key].split('{{{').length-1;
	closingTripleBraces = closingTripleBraces + base_locale['data'][key].split('}}}').length-1;
});
compareBraces('base locale', openingBraces, closingBraces, 'values', 'single');
compareBraces('base locale', openingDoubleBraces, closingDoubleBraces, 'values', 'double');
compareBraces('base locale', openingTripleBraces, closingTripleBraces, 'values', 'triple');

let translations = [];
findFiles('locales', /username-attestation_[a-z-]{5}\.json$/i, function(filepath) {
	let contents = fs.readFileSync(filepath, 'utf8');
	translations[filepath] = {'data': JSON.parse(contents), 'linecount': contents.trim().toString().split('\n').length};
});

// compare translation brace pairs in values
Object.keys(translations).forEach(function(filepath) {
	let openingBraces = 0;
	let closingBraces = 0;
	let openingDoubleBraces = 0;
	let closingDoubleBraces = 0;
	let openingTripleBraces = 0;
	let closingTripleBraces = 0;
	Object.keys(translations[filepath]['data']).forEach(function(key) {
		openingBraces = openingBraces + translations[filepath]['data'][key].split('{').length-1;
		closingBraces = closingBraces + translations[filepath]['data'][key].split('}').length-1;
		openingDoubleBraces = openingDoubleBraces + translations[filepath]['data'][key].split('{{').length-1;
		closingDoubleBraces = closingDoubleBraces + translations[filepath]['data'][key].split('}}').length-1;
		openingTripleBraces = openingTripleBraces + translations[filepath]['data'][key].split('{{{').length-1;
		closingTripleBraces = closingTripleBraces + translations[filepath]['data'][key].split('}}}').length-1;
	});
	compareBraces(filepath, openingBraces, closingBraces, 'values', 'single');
	compareBraces(filepath, openingDoubleBraces, closingDoubleBraces, 'values', 'double');
	compareBraces(filepath, openingTripleBraces, closingTripleBraces, 'values', 'triple');
});

// compare line counts with base file
Object.keys(translations).forEach(function(filepath) {
	compareLineCounts(filepath, translations[filepath]['linecount'], base_locale['linecount']);
});

// compare how many base keys in translation file
Object.keys(translations).forEach(function(filepath) {
	let key_matches = 0;
	Object.keys(base_locale['data']).forEach(function(key) {
		key_matches += translations[filepath]['data'].hasOwnProperty(key) ? 1 : 0;
	});
	compareMatchingKeys(filepath, key_matches, Object.keys(base_locale['data']).length, 'base', 'translation');
});

// compare how many translation keys in base file
Object.keys(translations).forEach(function(filepath) {
	let key_matches = 0;
	Object.keys(translations[filepath]['data']).forEach(function(key) {
		key_matches += base_locale['data'].hasOwnProperty(key) ? 1 : 0;
	});
	compareMatchingKeys(filepath, key_matches, Object.keys(translations[filepath]['data']).length, 'translation', 'base');
});

// compare line breaks with base file
Object.keys(translations).forEach(function(filepath) {
	let translation_breaks = 0;
	let base_breaks = 0;
	Object.keys(translations[filepath]['data']).forEach(function(key) {
		translation_breaks += translations[filepath]['data'][key].split('\n').length-1;
	});
	Object.keys(base_locale['data']).forEach(function(key) {
		base_breaks += base_locale['data'][key].split('\n').length-1;
	});
	compareLineBreaks(filepath, translation_breaks, base_breaks);
});
//console.log(translations);