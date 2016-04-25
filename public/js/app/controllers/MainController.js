(()=>{
	"use strict";
	
	angular.module('SpotifyMapper').controller('MainController', MainController);

	MainController.$inject = ['$scope', 'SpotifyService', 'Spotify', '$cookies'];

	function MainController($scope, SpotifyService, Spotify, $cookies){
		var nodeIds, shadowState, nodesArray, nodes, edgesArray, edges, network;
		var audioObject = new Audio();
		var playlistArtists = [];

		edgesArray = [];
		nodesArray = [];
		
		$scope.modal = {};
		$scope.ui = {};
		$scope.showTutorial = true;
		$scope.playlist = [];
		$scope.showImages = true;
		$scope.layout = 'hierarchical';

		((test)=>{
			console.log(test);
		})('test');

		if($cookies.get('token') != undefined){
			if($cookies.get('user') != undefined)
				$scope.user = JSON.parse($cookies.get('user'));
		}

		$scope.hideTutorial = () => {
			$scope.showTutorial = false;
		}

		var artistToNode = (artist) => {
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

    	$scope.login = () => {
	      	Spotify.login().then((data) => {
	      		$scope.token = data;
	      		$cookies.put('token', $scope.token);
	        	Spotify.getCurrentUser()
	        	.then((data)=> {
	          		$scope.user = data;
	          		$cookies.put('user', JSON.stringify($scope.user));
	        	})
	      	}, ()=> {
	        	console.log('didn\'t log in');
	      	})
	    };

		$scope.search = (query)=> {
			Spotify.search(query, 'artist').then((data)=> {
			  	$scope.artists = data.artists.items;
				$scope.artist = $scope.artists[0];
			});
		}

		$scope.searchSimilar = (id)=>{
			SpotifyService.searchSimilar(id)
			.then((res)=>{
				addSimilar(id, res.data.artists);
			}, (err)=>{
				console.log(err);
			});
		}

		$scope.playTopTrack = (id)=> {
			Spotify
			.getArtistTopTracks(id, 'BR')
			.then((data)=> {
			    $scope.track = data.tracks[0];
				$scope.tracks = data.tracks;

				audioObject.pause();
				audioObject = new Audio(data.tracks[0].preview_url);
                audioObject.play();
			});
		}

		$scope.createPlaylist = (playListName)=>{
			Array.prototype.shuffle = ()=> {
			  	var i = this.length, j, temp;
			  	if ( i == 0 ) return this;
			  	while ( --i ) {
			     	j = Math.floor( Math.random() * ( i + 1 ) );
			     	temp = this[i];
			     	this[i] = this[j];
			     	this[j] = temp;
			  	}
			  	return this;
			}

			$scope.hideModalPlaylist();
			$scope.ui.loading = true;
			Spotify
			.createPlaylist($scope.user.id, { name: 'Spotify Mapper - ' + playListName})
			.then((data)=> {
				$scope.playlistId = data.id;
			})
			.then(()=>{
				Spotify
  				.addPlaylistTracks($scope.user.id, $scope.playlistId, $scope.playlist.shuffle())
  				.then((data)=> {
  					$scope.ui.loading = false;
  					$scope.modal.message = "Playlist criada com sucesso!";
  					$scope.showModal();
  				});
			})
		}

		$scope.getTopTracks = (id)=>{
			var existArtistInPlaylist = (artist)=>{
				for (var i = 0; i < playlistArtists.length; i++) {
					if(playlistArtists[i] === artist.id){
						return true;
					}
				}
				return false;
			}

			Spotify
			.getArtistTopTracks(id, 'BR')
			.then((data)=> {
				var tracks = data.tracks;

				if(!existArtistInPlaylist(data.tracks[0].artists[0])){
					playlistArtists.push(data.tracks[0].artists[0].id);

					tracks.forEach((track, index)=>{
						if(index < 3){
							$scope.playlist.push(track.uri);
						}
					});
				}
			});
		}

	    $scope.startNetwork = (artist, reset)=> {
	    	$scope.artists = [];
	    	$scope.artist = artist;
	    	$scope.playlist = [];

	    	$scope.playlistName = $scope.artist.name;

	    	if(reset){
	    		nodesArray = [];
	    		edgesArray = [];
	    		nodesArray.push(artistToNode(artist));
				nodes = new vis.DataSet(nodesArray);
	        	edges = new vis.DataSet(edgesArray);
	    	}

	        shadowState = false;

	        var container = document.getElementById('network');
	        var data = {
	            nodes: nodes,
	            edges: edges
	        };

			var options = defaultOptions();

			if($scope.layout == 'hierarchical'){
				options.layout = {
                    hierarchical: {
                        direction: 'UD'
                    }
                }
			}
	        network = new vis.Network(container, data, options);

	        network.on("click", (params) => {
	        	if(params.nodes[0] != undefined){
		        	$scope.searchSimilar(params.nodes[0]);
		        	$scope.getTopTracks(params.nodes[0]);
	        	}
		    });

		    network.on("doubleClick", (params) => {
        		$scope.playTopTrack(params.nodes[0]);
    		});
	    }

	    var addSimilar = (id, similar) => {
	    	similar.forEach((artist, index) => {
	    		var existArtistInPlaylist = (artist) => {
					for (var i = 0; i < playlistArtists.length; i++) {
						if(playlistArtists[i] === artist.id){
							return true;
						}
					}

					return false;
				}

    			var edge = {from: id, to: artist.id};
    			var node = artistToNode(artist);

    			if(index < 3){
	    			try{	    		
	    				nodesArray.push(node);
	    				nodes.add(node);

    					if(!existArtistInPlaylist(artist)){
							Spotify.getArtistTopTracks(artist.id, 'BR')
							.then((data) => {
								var tracks = data.tracks;

								playlistArtists.push(data.tracks[0].artists[0].id);

								tracks.forEach((track, index) => {
									if(index < 3){
										$scope.playlist.push(track.uri);
									}
								});
							});
						}

		    			if(!existsEdge(edge) && existsNode(node)){
		    				edgesArray.push(edge);
		    				edges.add(edge);
		    			}
		    		} catch(err){
		    			if($scope.layout !== 'hierarchical'){
			    			if(!existsEdge(edge) && existsNode(node)){
				    			edgesArray.push(edge);
				    			edges.add(edge);
			    			}
			    		}
		    		}	
		    	}
	    	});
	    }

	    var existsEdge = (edge) => {
	    	for (var i = 0; i < edgesArray.length; i++) {
	    		if((edgesArray[i].from == edge.from && edgesArray[i].to == edge.to) ||
	    			(edgesArray[i].from == edge.to && edgesArray[i].to == edge.from) ||
	    			(edge.from == edgesArray[i].from && edge.to == edgesArray[i].to) ||
	    			(edge.from == edgesArray[i].to && edge.to == edgesArray[i].from)){
	    			return true;
				}
	    	}
	    	return false;
	    }

	    var existsNode = (node) =>{
	    	for (var i = 0; i < nodesArray.length; i++) {
	    		if(nodesArray[i].id == node.id)
	    			return true;
	    	}

	    	return false;
	    }

	    var setNodeEdges = (node, edges) => {
	    	for (var i = 0; i < nodesArray.length; i++) {
	    		if(node.id == nodesArray[i].id){
	    			nodesArray[i].edges = edges;
	    		}
	    	}
	    }

	    var countNodeEdges = (node) => {
	    	for (var i = 0; i < nodesArray.length; i++) {
	    		if(node.id == nodesArray[i].id){
	    			return nodesArray[i].edges;
	    		}
	    	}

	    	return 0;
	    }

	    var defaultOptions = () => {
	    	return {
			  	nodes: {
		  			borderWidth: 3,
    				borderWidthSelected: 3,
			    	shape: 'dot',
			    	scaling: {
			    		min: 20,
			    		max: 30,
			      		label: { 
			      			min: 14, 
			      			max: 30, 
			      			drawThreshold: 9, 
			      			maxVisible: 20 }
			    		},
			    	font: {
		    			size: 12, 
		    			face: 'Arial'
		    		},
		    		borderWidth: 3,
				    color: {
				      	border: "#1ed760",
				      	background: "#0a0a0a",
				      	highlight: {
				        	border: "#D3D71E",
				        	background: "#0a0a0a"
				      	},
				      	hover: {
        					border: "#fff",
        					background: "#0a0a0a"
      					}
				    },
			  	},
			  	interaction: {
				    hover: true,
				    hoverConnectedEdges: true,
				    selectConnectedEdges: true,
			  	},
				edges: {
				    color: {
				      	color: "rgba(31,33,32,1)",
				      	highlight: "#1ed760",
				      	inherit: false
				    }
			  	},
			};
	    }

	    $scope.playTrack = (track) => {
	    	$scope.track = track;
	    	audioObject.pause();
	    	audioObject = new Audio(track.preview_url);
            audioObject.play();
	    }

	    $scope.hideModalPlaylist = () => {
	    	$('#modalPlaylist').modal('hide');
	    }

	    $scope.showModalPlaylist = () => {
	    	$('#modalPlaylist').modal('show');
	    }

	    $scope.showModal = () => {
	    	$('#modal').modal('show');
	    }

	    $scope.hideModal = () => {
	    	$('#modal').modal('hide');
	    }
	}
})();