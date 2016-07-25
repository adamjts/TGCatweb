//features.js


var redshiftField = document.getElementById("redshift");
var binSizeField = document.getElementById("binSize");


redshiftField.onfocus = function(){
	this.value = "";
};

redshiftField.onblur = function(){
	if (this.value == " " || this.value == ""){
		this.value = "0.0";
	};
};








// WORK ON Y AXIS PLOTTING OPTIONS