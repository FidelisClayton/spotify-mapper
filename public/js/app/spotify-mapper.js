(function(){
	"use strict";

	angular.module('SpotifyMapper', ['angular-loading-bar'])
	.config(function(cfpLoadingBarProvider) {
    	cfpLoadingBarProvider.includeSpinner = false;
  	});
})();