//features.js


var redshiftField = document.getElementById("redshift");
var binSizeField = document.getElementById("binSize");
var binFactor = document.getElementById("binFactor");
var binSignalToNoise = document.getElementById("SignalToNoise");


redshiftField.onfocus = function(){
	this.value = '';
};


redshiftField.onblur = function(){
	if (this.value == " " || this.value == "" || isNaN(this.value)){
		this.value = "0.0";
	};
};


binFactor.onfocus = function(){
	//nothing
};

binFactor.onblur = function(){
	if (isNaN(this.value)){
		this.value = '';
	} else{
		binSignalToNoise.value = "";
	};
};
/*
binSignalToNoise.onfocus = function(){
	//nothing
};

binSignalToNoise.onblur = function(){
	if (isNaN(this.value)){
		this.value = '';
	} else{
		binFactor.value = '';
	};
};


*/



// WORK ON Y AXIS PLOTTING OPTIONS