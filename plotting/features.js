//features.js


var redshiftField = document.getElementById("redshift");

redshiftField.onfocus = function(){
	this.value = "";
};

redshiftField.onblur = function(){
	if (this.value == " " || this.value == ""){
		this.value = "0.0";
	};
};

