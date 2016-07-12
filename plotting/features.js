//features.js


var redshiftField = document.getElementById("redshift");

redshiftField.onfocus = function(){
	redshiftField.value = "";
};

redshiftField.onblur = function(){
	redshiftField.value = "0.0";
};