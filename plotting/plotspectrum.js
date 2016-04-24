"use strict";

$(document).ready(function(){ 
    var spectrum1 = {x: [1, 2, 3, 4, 5],
		     y: [1, 2, 4, 8, 16],
		     mode: 'lines',
		     hoverinfo: 'name',
		     name: 'Moritz',
		    };

    var data = [spectrum1];
    
    var layout = {
	title: 'TW Hydra - ObsID 6443',
	showlegend: true
    };

    var plotlyoptions = {displaylogo: false, scrollZoom: true, showLink: false, editable: true};

    var myplotarea = document.getElementById("plotarea");

    Plotly.plot( myplotarea, data, layout, plotlyoptions);


    $('.loglinear button').click(function(){
	var btn_id = this.parentNode.id,
	    myDiv = document.getElementById("plotarea");
	
	if ( btn_id == 'xaxislog' ){
	    if ( myDiv.layout.xaxis.type == 'log' )
	    {
		Plotly.relayout(myDiv, {'xaxis.type': 'linear'})
	    }
	    else
	    {
		Plotly.relayout(myDiv, {'xaxis.type': 'log'})
	    }
	}
	if ( btn_id == 'yaxislog' ){
	    if ( myDiv.layout.yaxis.type == 'log' )
	    {
		Plotly.relayout(myDiv, {'yaxis.type': 'linear'})
	    }
	    else
	    {
		Plotly.relayout(myDiv, {'yaxis.type': 'log'})
	    }
	}
    });
});
