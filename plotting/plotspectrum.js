//"use strict";
const Ang2keV = 12.389419;
const exposureTime = 1e4;
const numGraphs = 4;
spectra = [];
linespectra = [];
err_spectra = [];
data = [];



function convertBinUnit(){

	/*
		Changes the display of the range of each bin's x-parameter. It takes the current bin unit and size, along with the desired
	unit, and performs the conversion. It does NOT change the display of the graph.
	*/


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

	/*
		Can be conbined with the previous function. Right now used after bin factor is changed.
	*/
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



function convertyunit(area){

	/*
		Converts the y-units. NOT all of the unit conversions happen in this function--there were problems change the structure of the returned function.
		So the scalar multiplication parts of the conversions happen in this function, but for unit conversions that involve looping through respective
		wavelengths etc, the rest is carried out within the Spectrum object.
	*/
    //var binSize = $("#binSize").html(); 
    var binSize = 0.05; // This is hard-coded because each time the y-value is changed, it reverts back to the original plot and then the binning is re-applied later
    var unit = $('#yunit').val();

    var h = 6.626e-34;
	var c = 3.0e8;
	var joules_to_KeV = 6.242e15;

    var factor = {'counts/X/s' : 1, 'counts/bin':(exposureTime*binSize), 'Fy' : (binSize), 'Fy/X' : 1, 'FX': h*c*joules_to_KeV, 'XFX': h*c*joules_to_KeV*binSize};
    var f = factor[unit];
    //not all conversions are complete... some functionality is still in the other function convert_to_y_unit...
    return{
		y_unit: unit,
		yfunc : function(val){return val * f;},
	};

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
	    this.effective_area_in.push(+ Math.random()); //THIS WILL EVENTUALLY HAVE TO BE THE CORRECT DATA FROM ROW[4?].... right now the number is randomly generated just for skeleton purposes
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

        /*
            This is here to update the unit displayed in the y-axis label when the x-unit changes.
        */

    	var xunit = $("#xunit").val();
    	var yunit = $("#yunit").val();
    	switch(yunit){
    		case 'counts/X/s':
    			this.y_type = 'counts / s / ' + xunit;
    			break;
    		case 'Fy/X':
    			this.y_type = 'photons / area / second / '+ xunit;
    			break;
    		case 'FX':
    			this.y_type = 'KeV / area / second / ' + this.x_unit;
    			break;
    	};
    };

    this.convert_to_yunit = function(){
    	var area = this.effective_area_in;
    	var converter = convertyunit(area);
    	switch(converter.y_unit){
    		case 'counts/X/s':
    		case 'counts/bin':
    			this.y = this.y_in.map(converter.yfunc);
    			break;
    		case 'Fy':
    		case 'Fy/X':
    			this.y = this.y_in.map(converter.yfunc);
    			for (i=0; i < this.y.length; i++){
    				this.y[i] = this.y[i]/area[i];
    			};
    			break;
    		case 'FX':
    		case 'XFX':
    			this.y = this.y_in.map(converter.yfunc);
    			for (i=0; i < this.y.length; i++){
    				this.y[i] = this.y[i] / (area[i]*this.x_mid_in[i]*1.0e-10);
    			};
    			break;
    		default:
    			this.y = this.y_in.map(converter.yfunc);
    		break;
    	};


    	//This changes the label
    	switch(converter.y_unit){
    		case 'counts/X/s':
    			this.y_type = 'counts / s / ' + this.x_unit;
    			break;
    		case 'counts/bin':
    			this.y_type = 'counts / bin'
    			break;
    		case 'Fy':
    			this.y_type = 'photons / area / second'; 
    			break;
    		case 'Fy/X':
    			this.y_type = 'photons / area / second / ' + this.x_unit;
    			break;
    		case 'FX':
    			this.y_type = 'KeV / area / second / ' + this.x_unit;
    			break;
    		case 'XFX':
    			this.y_type = 'KeV / area / second';
    			break;
    		default:
    			this.y_type = 'default';
    			break;
    	};


    };

    this.updateBins = function(binFactor){ 
    	
    	/*
			Changes bin size by constant factor. Bug: lower signal areas on the graph sometimes lead to larger bin sizes.
    	*/
    	numloops = 0;


    	this.y = this.y_in;
    	this.x = this.x_in;
    	this.x_mid = this.x_mid_in;
    	//now we convert the units... then rebin.

    	this.convert_to_yunit();
    	this.convert_to_xunit();



    	// have to convert the binsize to factor 1 again... make copies of all arrays, then construct the new this.x etc using this new arrays...

    	var x_tmp = this.x;
    	var y_tmp = this.y;
    	var x_mid_tmp = this.x_mid;

    	this.x = [];
    	this.y = [];
    	this.x_mid = [];

    	for (i=0; i < this.y_in.length/binFactor; i++){
    		//numloops++;

    		this.x.push(x_tmp[i*binFactor]);
    		this.x_mid.push(x_mid_tmp[i*binFactor]);

    		this.y.push(y_tmp.slice(i*binFactor, (i+1)*binFactor).reduce(function(a, b) {return a+b;}, 0));
    	};
    };

    this.updateBins_StN = function(StN){
    	/*
			Changes bin sizes by signal to noise. Not complete yet.

            This function works if the y-units are converted first
    	*/

    	var photon_min = StN * StN;



    	this.y = this.y_in;
    	this.x = this.x_in;
    	this.x_mid = this.x_mid_in;


    	this.convert_to_yunit();
    	this.convert_to_xunit();


    	var x_tmp = this.x;
    	var y_tmp = this.y;
    	var x_mid_tmp = this.x_mid;


    	this.x = [];
    	this.y = [];
    	this.x_mid = [];

    	var dataRemains = true;

    	var rowCounter = 0;
    	var lastRow = 0;
    	var photon_count = 0;



        var photonArray = this.y_in.map(function(x) {return x * 0.05 * exposureTime});

    	while(dataRemains){

    		$('#display').html(rowCounter); // THIS IS JUST FOR DEBUGGING PURPOSES

            photon_count = photon_count + (photonArray[rowCounter]);

    		if(photon_count >= photon_min){
    			//this.x.push(x_tmp[lastRow]);
    			//this.x_mid.push(x_mid_tmp[lastRow]);
    			this.x.push(x_tmp[rowCounter]);
    			this.x_mid.push(x_mid_tmp[rowCounter]);
    			this.y.push(y_tmp.slice(lastRow, rowCounter).reduce(function(a,b){return a+b}, 0));

    			lastRow = rowCounter;
    			photon_count = 0;

    			//now check if there are enough remaining photons to continue looping through without reaching undefined indeces in the arrays.
    			var remaining_photons = 0;
    			for(i = rowCounter;i < photonArray.length; i++){
    				//remaining_photons = remaining_photons + (y_tmp[i]*photonFactor);
                    remaining_photons = remaining_photons + (photonArray[i]);
    			};
    			if (remaining_photons < photon_min ){
    				dataRemains = false;
    				break;
    			};

    		};


    		rowCounter++



    	};

    	$("#binFactor").val("");
        $("#binSize").html("<i style='color:#bfbfbf'>(varying)</i>");


    };

};

function LineSpec(spec, g) {
    this.type = 'scatter';
    colors = ['blue', 'red', 'green', 'orange'];
    this.line = {shape: 'hv', color: colors[g]};
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
};



function resetBins(){
	/*
		This is a convenient function to have just to return all the data to standard display so that other conversion operations can be used.
	*/
	//document.getElementById("binFactor").value = 1;
	//updateBinSize();
	for (i=0 ; i < numGraphs; i++){
		spectra[i].updateBins(1);
	}; 

};





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
    //var rawDataURL = 'https://raw.githubusercontent.com/hamogu/TGCatweb/master/testdata/1460764540T1835972358ascii.dat'
    var rawDataURLs = [];

    for (i = 0; i < numGraphs; i++){
    	rawDataURLs.push("https://raw.githubusercontent.com/hamogu/TGCatweb/master/testdata/1460764540T1835972358ascii.dat");
    };

    var layout;
    data.push(hlike);


    $.get(rawDataURLs[0], function(spec_data, status){
		if (status != 'success'){
	   			alert("Data download failed.\nStatus: " + status);
	   			return;
		};

		//************************************ THE WAY RAW DATA IS RETREIVED WILL BE DIFFERENT WHEN HOOKED INTO PHP
		for (g = 0; g < numGraphs; g++){
			var rawdata = Plotly.d3.tsv.parseRows(spec_data);
			var spec1 = new Spectrum(rawdata);
			var spectrum1 = new LineSpec(spec1, g);
			var err_spectrum1 = new ErrSpec(spec1, spectrum1);
			spectra.push(spec1);
			linespectra.push(spectrum1);
			err_spectra.push(err_spectrum1);

			data.push(spectrum1, err_spectrum1);
		};




		layout = {
			title: 'TW Hydra - ObsID 6443',
			showlegend: true,
	    	xaxis: {title: spectra[0].xlabel()},
	    	yaxis: {title: spectra[0].ylabel()},
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

   	});

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
 		//remember bin size and reset them so that we can do the unit conversions
 		var binFactor = document.getElementById("binFactor").value; 
        var binStN = document.getElementById("SignalToNoise").value;
 		resetBins();		
	    hlike.update();

	    //set to correct units
	    for (g=0; g < numGraphs; g++){
	    	spectra[g].convert_to_xunit();
	    };	

		//re-apply the rebinning
        if(isNaN(binStN) || binStN == ''){
            document.getElementById("binFactor").value = binFactor;
            updateBinSize();
            for (g = 0; g< numGraphs; g++){
                spectra[g].updateBins(binFactor);
            };
        };
        if (isNaN(binFactor) || binFactor == ''){
            for (g = 0; g< numGraphs ; g++){
                spectra[g].updateBins_StN(binStN);
            };
        };

		//replot
		plotarea.data[0].x = hlike.x;
		for(g=0; g < numGraphs; g++){
	    	plotarea.data[(2*g)+1].x = spectra[g].x;
	    	plotarea.data[(2*g)+1].y = spectra[g].y;
	    	plotarea.data[(2*g)+2].x = spectra[g].x_mid;
	    	plotarea.data[(2*g)+2].y = spectra[g].y;
	    	plotarea.data[(2*g)+2].error_y.array = spectra[g].err;
	    	plotarea.layout.xaxis.title = spectra[g].xlabel();
	    	plotarea.layout.yaxis.title = spectra[g].ylabel();

	    };	
	    Plotly.redraw(plotarea);

	    //Display the correct bin units
	    convertBinUnit();

	});

	$('#yunit').change(function(){
		//remember the binsize and reset them so that we can do the unit conversions

		var binFactor = document.getElementById("binFactor").value;
        var binStN = document.getElementById("SignalToNoise").value;
		resetBins();
		hlike.update();
		for (g = 0; g < numGraphs; g++){
			spectra[g].convert_to_yunit;
		};

		//re-apply the binning

        //if the binning was by a constant factor then:
        if(isNaN(binStN) || binStN == ''){
      
            document.getElementById("binFactor").value = binFactor;
            updateBinSize();
            for (g = 0 ; g< numGraphs ; g++){
                spectra[g].updateBins(binFactor);
            };
        };
        //if the binning was by Signal-to-Noise then:
        if(isNaN(binFactor) || binFactor == ''){
            for (g = 0; g < numGraphs; g++){
                spectra[g].updateBins_StN(binStN);
            };
        };



		//update the plot
		plotarea.data[0].x = hlike.x;
		for(g=0; g < numGraphs; g++){
	    	plotarea.data[(2*g)+1].x = spectra[g].x;
	    	plotarea.data[(2*g)+1].y = spectra[g].y;
	    	plotarea.data[(2*g)+2].x = spectra[g].x_mid;
	    	plotarea.data[(2*g)+2].y = spectra[g].y;
	    	plotarea.data[(2*g)+2].error_y.array = spectra[g].err;
	    	plotarea.layout.xaxis.title = spectra[g].xlabel();
	    	plotarea.layout.yaxis.title = spectra[g].ylabel();

	    };	
	    Plotly.redraw(plotarea);
	});

	$('#redshift').change(function(){
	    hlike.update();
	    plotarea.data[0].x = hlike.x;
	    Plotly.redraw(plotarea);
	});

	$("#binFactor").change(function(){

		if ((this.value == 0) || (isNaN(this.value)) || (this.value > spectra[0].x.length) || (this.value%1 != 0)){
			alert("Not a valid bin size");
			this.value = "";
		} else{
			var binFactor = $("#binFactor").val();
			updateBinSize();

			for (g = 0; g < numGraphs; g++){
				spectra[g].updateBins(binFactor);
			};
			
		plotarea.data[0].x = hlike.x;
		for(g=0; g < numGraphs; g++){
	    	plotarea.data[(2*g)+1].x = spectra[g].x;
	    	plotarea.data[(2*g)+1].y = spectra[g].y;
	    	plotarea.data[(2*g)+2].x = spectra[g].x_mid;
	    	plotarea.data[(2*g)+2].y = spectra[g].y;
	    	plotarea.data[(2*g)+2].error_y.array = spectra[g].err;
	    	plotarea.layout.xaxis.title = spectra[g].xlabel();
	    	plotarea.layout.yaxis.title = spectra[g].ylabel();

	    };	
	    Plotly.redraw(plotarea);
		};	
	});


	$("#SignalToNoise").change(function(){
		var StN = this.value;
		
        //check if this StN is a reasonable number:
        //It has to be less than the total detected photons for all graphs
        var acceptable_StN = true;
        if (isNaN(StN)){
            acceptable_StN = false;
        } else{
            for(g = 0; g< numGraphs; g++){
                if( (StN*StN) >= (spectra[g].y_in.slice(0, spectra[g].y_in.length).reduce(function(a,b){return a+b}, 0) * 0.05 * exposureTime) ){
                    acceptable_StN = false;
                };
            };
        };

        //Now if StN is reasonable, then do the transformations:

        if(acceptable_StN){
            for (g = 0; g < numGraphs; g++){
                spectra[g].updateBins_StN(StN);
            };

            plotarea.data[0].x = hlike.x;
            for(g=0; g < numGraphs; g++){
                plotarea.data[(2*g)+1].x = spectra[g].x;
                plotarea.data[(2*g)+1].y = spectra[g].y;
                plotarea.data[(2*g)+2].x = spectra[g].x_mid;
                plotarea.data[(2*g)+2].y = spectra[g].y;
                plotarea.data[(2*g)+2].error_y.array = spectra[g].err;
                plotarea.layout.xaxis.title = spectra[g].xlabel();
                plotarea.layout.yaxis.title = spectra[g].ylabel();
            };	
            Plotly.redraw(plotarea);
        } else{
            alert('"'+StN+'"' + ' is not valid Signal-to-Noise');
            this.value = '';
        }


	});



});


/*
PROBLEM:
- conversions explode in y value after many changes... need to find bug.
 */
	
