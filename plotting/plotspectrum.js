"use strict";

function Spectrum(rawdata){
    // TBD: add safty checks: right units in header, at least x data values etc.
    this.x_lo_in = [];
    this.x_hi_in = [];
    this.x_mid_in = [];
    this.y_in = [];
    this.err_in = [];
    this.x_unit_in = 'Å';
    this.x_type_in = 'wavelength';
    this.y_type_in = 'counts / s';

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
	}
    };
    this.n_points = this.x_mid_in.length;
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
    this.ylabel = function() {return this.y_type + " / " + this.x_unit};

    this.convert_to_xunit = function(xunit){
	switch(xunit) {
	case 'Å':
	case 'nm':
	case 'mm':
	case 'm':
	case 'micron':
	case 'cm':
	    var factor = {'Å': 1, 'nm': 10, 'micron': 1e4, 'mm': 1e7, 'cm': 1e8, 'm':1e10};
	    var f = factor[xunit];
	    this.x_type = 'wavelength';
	    this.x_unit = xunit;
	    this.x = [];
	    this.x_mid = [];
	    this.y = [];
	    this.err = [];
	    for (i = 0; i < this.n_points; i++) {
		this.x.push(this.x_lo_in[i] / f);
		this.x_mid.push(this.x_mid_in[i] / f);
		this.y.push(this.y_in[i] * f);
		this.err.push(this.err_in[i] * f);
	    }
	    // Prevent end of plot from hangin in air
	    this.x.push(this.x_hi_in[-1] / f);
	    this.y.push(0);
	    break;

	default:
	    alert('Unit: ' + xunit + ' not supported.');
	}
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

//var plotlyoptions = {displaylogo: false, scrollZoom: true, showLink: false, editable: true};
var plotlyoptions = {displaylogo: false, scrollZoom: true, showLink: true,
		     linkText: 'Edit plot on external website'};


$(document).ready(function(){

    var i;
    // This will later be replaced with php I guess
    var rawDataURL = 'https://raw.githubusercontent.com/hamogu/TGCatweb/master/testdata/1460764540T1835972358ascii.dat'

    var rawdata;
    var row;
    var x_lo = [];
    var x_hi = [];
    var x_mid = [];
    var y_read = [];
    var err_read = [];
    
    $.get(rawDataURL, function(data, status){
        if (status != 'success'){
	    alert("Data download failed.\nStatus: " + status);
	    return;
	}
	rawdata = Plotly.d3.tsv.parseRows(data);
	var spec1 = new Spectrum(rawdata);
	var spectrum1 = new LineSpec(spec1);
	var err_spectrum1 = new ErrSpec(spec1, spectrum1);
	var data = [spectrum1, err_spectrum1];
    
	var layout = {
	    title: 'TW Hydra - ObsID 6443',
	    showlegend: true,
	    xaxis: {title: spec1.xlabel()},
	    yaxis: {title: spec1.ylabel()},
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
	    if ( plotarea.layout.xaxis.type == 'log' )
	    Plotly.relayout(plotarea, {'yaxis.type': 'linear'})
	    else
	    Plotly.relayout(plotarea, {'yaxis.type': 'log'})
	});
	$('#xunit').change(function(){
	    spec1.convert_to_xunit(this.value);
	    plotarea.data[0].x = spec1.x;
	    plotarea.data[0].y = spec1.y;
	    plotarea.data[1].x = spec1.x_mid;
	    plotarea.data[1].y = spec1.y;
	    plotarea.data[1].error_y.array = spec1.err;
	    plotarea.layout.xaxis.title = spec1.xlabel();
	    plotarea.layout.yaxis.title = spec1.ylabel();
	    Plotly.redraw(plotarea);
	});
    });
});
