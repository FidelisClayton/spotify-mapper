(function(){
	"use strict";

	angular.module('SpotifyMapper', ['angular-loading-bar', 'angucomplete-alt'])
	.config(function(cfpLoadingBarProvider) {
    	cfpLoadingBarProvider.includeSpinner = false;
  	});
})();