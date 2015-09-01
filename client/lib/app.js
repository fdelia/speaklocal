(function() {
	'use strict';



	Accounts.ui.config({
		passwordSignupFields: 'USERNAME_AND_EMAIL'
	});


	angular.module('app', ['angular-meteor', 'ui.router', 'ngSanitize', 'ui.bootstrap',
		'monospaced.elastic', 'ngFileUpload', 'ngImgCrop'
	]);


})();

var sApp = Date.now();