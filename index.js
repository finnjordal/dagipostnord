"use strict"

let parse= require('csv-parse'),
	fs= require('fs'),
	util= require('util');

var postnord = fs.createReadStream('postnord.csv');
let postnordparser = parse({delimiter: ';', columns: true});

var dagi = fs.createReadStream('dagi.csv');
let dagiparser = parse({delimiter: ',', columns: true});

let antalfærdige= 0;

//-----------------------------------------------------------------------------------------------------------------
// transformer
//

function difference(setA, setB) {
  var _difference = new Set(setA);
  for (var elem of setB) {
      _difference.delete(elem);
  }
  return _difference;
}

function compare() {
	let eridagi= difference(dagiset,postnordset);
	console.log('Er i DAGI, men ikke i Postnord');
	for (let item of eridagi) console.log(item); 
	let eripostnord= difference(postnordset, dagiset);
	console.log('Er i PostNord, men ikke i DAGI');
	for (let item of eripostnord) console.log(item);  

}

const { Transform } = require('stream');

class AnalyseTransform extends Transform {
  constructor(options) {
    super(options);
    this.antal= 0;
    this.name= options.name;
    this.set= options.set;
  }
  _transform(chunk, encoding, callback) {
  	this.antal++;
  	this.set.add(chunk.Postnr);
		//this.push(chunk.Postnr);
		callback();
  }
  _final(callback) {
  	const tekst= util.format('%s: %d postnumre\n\r', this.name, this.antal);
  	this.push(tekst);
  	antalfærdige++;
  	if (antalfærdige === 2) {
  		compare();
  	}
		callback();
  }
}

var postnordset = new Set();
var analysepostnord = new AnalyseTransform({objectMode: true, name: 'postnord', set: postnordset});

analysepostnord.on('error', function (err) {
  console.log("analysepostnord - analyse error: %s", err);
});


var dagiset = new Set();
var analysedagi = new AnalyseTransform({objectMode: true, name: 'dagi', set: dagiset});

analysedagi.on('error', function (err) {
  console.log("analysedagi - analyse error: %s", err);
});


postnord.pipe(postnordparser).pipe(analysepostnord).pipe(process.stdout);
dagi.pipe(dagiparser).pipe(analysedagi).pipe(process.stdout);

//input.pipe(process.stdout);