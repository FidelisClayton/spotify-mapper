(function(){
	angular.module('spotify-mapper').service('FunctionsService', function(){
		this.artistToNode = function(artist){
    		var node = {
    			id: artist.id,
    			label: artist.name,
    			value: artist.followers.total
    		};

    		if($scope.showImages){
    			node.shape = 'circularImage';
    			node.image = artist.images[artist.images.length -2].url;
    		}

    		return node;
    	}

    	this.existArtistInPlaylist = function(artist, playlistArtists){
			for (var i = 0; i < playlistArtists.length; i++) {
				if(playlistArtists[i] === artist.id){
					return true;
				}
			}

			return false;
		}


	});
})();