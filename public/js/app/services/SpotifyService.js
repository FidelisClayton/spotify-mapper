	"use strict";

	angular.module('SpotifyMapper').service('SpotifyService', function($http){
		this.searchArtist = function(query){
			return $http.get('https://api.spotify.com/v1/search?q=' + query + '&type=artist');
		};

		this.searchSimilar = function(id){
			return $http.get('https://api.spotify.com/v1/artists/' + id + '/related-artists');
		};

		this.searchTopTracks = function(id){
			return $http.get('https://api.spotify.com/v1/artists/' + id + '/top-tracks?country=SE')
		};
	});