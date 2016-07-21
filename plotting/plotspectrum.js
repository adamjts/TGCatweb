"use strict";
const Ang2keV = 12.389419;
const exposureTime = 1e4;



function convertBinUnit(){


	var newUnit = $('#xunit').val();
	var currentVal = $('#binSize').html();
	var currentUnit = $("#bin_units").html();

	var factor = {'Å': 1, 'nm': 10, 'micron': 1e4, 'mm': 1e7, 'cm': 1e8, 'm':1e10};

	var newVal = currentVal * (factor[currentUnit]/factor[newUnit]);
	newVal = parseFloat(newVal.toPrecision(2));
	newVal = newVal.toExponential();

	$("#binSize").html(newVal);
	$("#bin_units").html(newUnit);

	return 0;

};


function updateBinSize(){
	var binSize = $('#binFactor').val() * 0.05; //In Angstroms
	var currentUnits = $('#bin_units').html();
	var factor = {'Å': 1, 'nm': 0.1, 'micron': 1e-4, 'mm': 1e-7, 'cm': 1e-8, 'm':1e-10};

	binSize = binSize * factor[currentUnits];

	$('#binSize').html(binSize);

};



function convertunit(){
    var unit = $('#xunit').val()
    var utype;
    switch(unit) {
    case 'Å':
    case 'nm':
    case 'mm':
    case 'm':
    case 'micron':
    case 'cm':
	var factor = {'Å': 1, 'nm': 10, 'micron': 1e4, 'mm': 1e7, 'cm': 1e8, 'm':1e10};
	var f = factor[unit];
	return {
	    x_type: 'wavelength',
	    x_unit: unit,
	    xfunc: function(val){return val / f;},
	    yfunc: function(val){return val * f;},
	};
	break;
    case 'eV':
    case 'keV':
    case 'MeV':
    case 'GeV':
    case 'TeV':
    case 'Hz':
    case 'kHz':
    case 'MHz':
    case 'GHz':
	var factor = {'eV': 1e-3, 'keV': 1, 'MeV': 1e3, 'GeV': 1e6, 'TeV': 1e9,
		      'Hz': 2.417989e17, 'kHz': 2.417989e14, 'MHz': 2.417989e11,
		      'GHz': 2.417989e8}
	var f = factor[unit];
	if (unit.includes('eV')) {
	    utype = 'energy';
	} else {
	    utype = 'frequency';
	}
	return {
	    x_type: utype,
	    x_unit: unit,
	    xfunc: function(val){return f * Ang2keV / val;},
	    yfunc: function(val){return val / f / Ang2keV;},
	};
	break;
    default:
	alert('Unit: ' + unit + ' not supported.');
    }
};



function convertyunit(){
	var area = 1;
    var binSize = $("#binSize").html(); // THIS WILL BE IN SOME UNIT NOT NECESSARILY ANGSTROMS
    var unit = $('#yunit').val();
    var factor = {'counts/X/s' : 1, 'counts/bin':(exposureTime*binSize), 'Fy' : (binSize/area), 'Fy/X' : 1/area};
    var f = factor[unit];
    return {
    	y_unit: unit,
	    yfunc: function(val){return val * f;},
	};
};

function divideArrays(a,b){
	for(i=0; i<a.length; i++){
		a[i] = a[i]/b[i]
	};
	return a;
};

function Spectrum(rawdata){
    // TBD: add safty checks: right units in header, at least x data values etc.
    this.x_lo_in = [];
    this.x_hi_in = [];
    this.x_mid_in = [];
    this.y_in = [];
    this.err_in = [];
    this.effective_area_in=[];
    this.x_unit_in = 'Å';
    this.x_type_in = 'wavelength';
    this.y_type_in = 'counts / s / Å';



    var i, row;
    for (i = 0; i < rawdata.length; i++) {
	row = rawdata[i][0]
	// ignore comments in file
	if (row.charAt(0) != '#'){
	    // split on one or more white spaces
	    row = row.trim().split(/[\s]+/);
	    this.x_lo_in.push( +row[0]);
	    this.x_hi_in.push( +row[1]);
	    this.x_mid_in.push( 0.5 * row[0] + 0.5 * row[1]);
	    this.y_in.push( +row[2]);
	    this.err_in.push( +row[3]);
	    this.effective_area_in.push(+ Math.random()); //THIS WILL EVENTUALLY HAVE TO BE THE CORRECT DATA FROM ROW[].... right now the number is randomly generated just for skeleton purposes
	}
    };
    this.x = this.x_lo_in;
    this.x.push(this.x_hi_in[-1]);
    this.y = this.y_in;
    this.y.push(0);
    this.x_mid = this.x_mid_in;
    this.err = this.err_in;
    this.x_type = this.x_type_in;
    this.x_unit = this.x_unit_in;
    this.y_type = this.y_type_in;

    this.xlabel = function() {return this.x_type + "[" + this.x_unit + "]"};
    this.ylabel = function() {return this.y_type};

    this.convert_to_xunit = function(){
	var converter = convertunit()
	this.x_type = converter.x_type;
	this.x_unit = converter.x_unit;
	this.update_ylabel_scale();
	switch (converter.x_type) {
	case "wavelength":
	    this.x = this.x_lo_in.map(converter.xfunc);
	    //this.y = this.y_in.map(converter.yfunc); // I"M NOT SURE WHY THIS COMMAND USED TO BE HERE,
	    // Prevent end of plot from hanging in air
	    this.x.push(converter.xfunc(this.x_hi_in[-1]));
	    this.y.push(0);
	    break;

	case "energy":
	case "frequency":
	    this.x = this.x_hi_in.map(converter.xfunc);
	    this.y = this.y_in.map(converter.yfunc);
	    // Prevent end of plot from hanging in air
	    this.x.unshift(converter.xfunc(this.x_lo_in[0]));
	    this.y.unshift(0);
	    break;
	    
	default:
	    alert('Conversion not supported');
	};
	this.x_mid = this.x_mid_in.map(converter.xfunc);
	this.err = this.err_in.map(converter.yfunc);
    };

    this.update_ylabel_scale = function(){
    	var xunit = $("#xunit").val();
    	var yunit = $("#yunit").val();
    	switch(yunit){
    		case 'counts/X/s':
    			this.y_type = 'counts / s / ' + xunit;
    	};
    };

    this.convert_to_yunit = function(){
    	var area = this.effective_area_in;
    	var converter = convertyunit();
    	switch(converter.y_unit){
    		case 'counts/X/s':
    		case 'counts/bin':
    		this.y = this.y_in.map(converter.yfunc);
    		break;
    		case 'Fy':
    		this.y = this.y_in.map(converter.yfunc);
    		this.y = divideArrays(this.y, area);
    		//divide by the correct effective areas
    		break;
    		default:
    		this.y = this.y_in.map(converter.yfunc);
    		break;
    	};

    	//this.y = this.y_in.map(converter.yfunc);
    	//this.y.push(0);

    	//This changes the label
    	switch(converter.y_unit){
    		case 'counts/X/s':
    			this.y_type = 'counts / s / ' + this.x_unit;
    			break;
    		case 'counts/bin':
    			this.y_type = 'counts / bin'
    			break;
    		case 'Fy':
    			this.y_type = 'Fy'; //THIS SHOULD BE THE ACUAL NAME... Photons per area per second?
    			break;
    		default:
    			this.y_type = 'default';
    			break;
    	};


    };

};

function LineSpec(spec) {
    this.type = 'scatter';
    this.line = {shape: 'hv', color: 'blue'};
    this.x = spec.x;
    this.y = spec.y;
    this.mode = 'lines';
    this.hoverinfo = 'name';
    this.name = 'Obs ID 6443';
};
function ErrSpec(spec, linespec) {
    this.type = 'scatter';
    this.mode = 'markers';
    this.visible ="legendonly";
    this.x = spec.x_mid;
    this.y = spec.y;
    this.name = 'Errors for ' + linespec.name;
    this.hoverinfo = 'y';
    this.error_y = {
	width: 0,
	array: spec.err,
	thickness:1.5,
	color: linespec.line.color,
    };
    this.line = {width: 1, color: linespec.line.color};
};

function LineList(title, names, energies) {
    if (names.length != energies.length)
    { alert("Error in creating LineList.");};
    this.text = names;
    this.energy = energies;
    this.wavelength = this.energy.map(function(val){return Ang2keV/val});
    this.redshifter = function(){
	var z = parseFloat($('#redshift').val());
	return function (wave){return wave * (1 + z)};
    }
    this.update = function(){
	var converter = convertunit()
	this.x = this.wavelength.map(this.redshifter()).map(converter.xfunc);
	this.y = new Array(this.x.length);
	this.y.fill(0.9);
    };
    this.update();
    this.type = 'scatter';
    this.mode = 'markers';
    this.hoverinfo = 'x+text';
    this.name = title;
    this.visible = 'legendonly';
    this.marker ={
	color:"red",
	symbol:"line-ns-open",
	line:{
            width:3
	}
    };
    this.yaxis = 'y2';
}
//var plotlyoptions = {displaylogo: false, scrollZoom: true, showLink: false, editable: true};
var plotlyoptions = {displaylogo: false, showLink: true,
		     linkText: 'Edit plot on external website'};


$(document).ready(function(){

    // Don't trust the html to set th right defaults, so do that here.
    $('#xunit').val('Å');
    $('#redshift').val("0.0");

    
    var hlike = new LineList("H-like lines",
			     ['O VII', 'O VII', 'Ne X', 'Ne X', 'Mg XII', 'Mg XII'],
			     [0.653589, 0.774679, 1.02168, 1.21102, 1.47201, 1.74489]);
    
			     
    // This will later be replaced with php I guess
    var rawDataURL = 'https://raw.githubusercontent.com/hamogu/TGCatweb/master/testdata/1460764540T1835972358ascii.dat'

    var rawdata;
    
    $.get(rawDataURL, function(data, status){
        if (status != 'success'){
	    alert("Data download failed.\nStatus: " + status);
	    return;
	}
	rawdata = Plotly.d3.tsv.parseRows(data);
	var spec1 = new Spectrum(rawdata);
	var spectrum1 = new LineSpec(spec1);
	var err_spectrum1 = new ErrSpec(spec1, spectrum1);
	var data = [hlike, spectrum1, err_spectrum1];
    
	var layout = {
	    title: 'TW Hydra - ObsID 6443',
	    showlegend: true,
	    xaxis: {title: spec1.xlabel()},
	    yaxis: {title: spec1.ylabel()},
	    yaxis2: {
		anchor: 'free',
		overlaying: 'y',
		side: 'right',
		showticklabels: false,
		showgrid: false,
		zeroline: false,
		showline: false,
		range: [0, 1],
		fixedrange: true,
	     },
	};

	var plotarea = document.getElementById("plotarea");

	Plotly.plot( plotarea, data, layout, plotlyoptions);

	$('#xaxislog').click(function(){
	    if ( plotarea.layout.xaxis.type == 'log' )
	    Plotly.relayout(plotarea, {'xaxis.type': 'linear'})
	    else
	    Plotly.relayout(plotarea, {'xaxis.type': 'log'})
	});
	$('#yaxislog').click(function(){
	    if ( plotarea.layout.yaxis.type == 'log' )
	    Plotly.relayout(plotarea, {'yaxis.type': 'linear'})
	    else
	    Plotly.relayout(plotarea, {'yaxis.type': 'log'})
	});
 	$('#xunit').change(function(){
	    hlike.update();
	    spec1.convert_to_xunit();
	    plotarea.data[0].x = hlike.x;
	    plotarea.data[1].x = spec1.x;
	    plotarea.data[1].y = spec1.y;
	    plotarea.data[2].x = spec1.x_mid;
	    plotarea.data[2].y = spec1.y;
	    plotarea.data[2].error_y.array = spec1.err;
	    plotarea.layout.xaxis.title = spec1.xlabel();
	    plotarea.layout.yaxis.title = spec1.ylabel();
	    Plotly.redraw(plotarea);

	    convertBinUnit();
	});
	$('#yunit').change(function(){
		hlike.update();
		spec1.convert_to_yunit();
		plotarea.data[0].x = hlike.x;
	    plotarea.data[1].x = spec1.x;
	    plotarea.data[1].y = spec1.y;
	    plotarea.data[2].x = spec1.x_mid;
	    plotarea.data[2].y = spec1.y;
	    plotarea.data[2].error_y.array = spec1.err;
	    plotarea.layout.xaxis.title = spec1.xlabel();
	    plotarea.layout.yaxis.title = spec1.ylabel();
	    Plotly.redraw(plotarea);

	});
	$('#redshift').change(function(){
	    this.val(parseFloat(this.val()));
	    hlike.update();
	    plotarea.data[0].x = hlike.x;
	    Plotly.redraw(plotarea);
	});
	$('#binSize').change(function(){
		binSize = this.val();
	});

	document.getElementById("binFactor").onblur = function(){
		updateBinSize();
	};

	$("#display").html(spec1.y);

    });
});
