(function(){
	"use strict";
	
	angular.module('SpotifyMapper').controller('MainController', function($scope, SpotifyService){
		var nodeIds, shadowState, nodesArray, nodes, edgesArray, edges, network;
		var audioObject = new Audio();

		$scope.showTutorial = true;

		edgesArray = [];
		nodesArray = [];

		$scope.showImages = true;
		$scope.layout = 'hierarchical';

		$scope.hideTutorial = function(){
			$scope.showTutorial = false;
		}

		function artistToNode(artist){
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

		$scope.search = function(query){
			SpotifyService.searchArtist(query)
			.then(function(res){
				$scope.artists = res.data.artists.items;
				$scope.artist = $scope.artists[0];
			}, function(err){
				console.log(err);
			});
		}

		$scope.searchSimilar = function(id){
			SpotifyService.searchSimilar(id)
			.then(function(res){
				addSimilar(id, res.data.artists);
			}, function(err){
				console.log(err);
			});
		}

		$scope.playTopTrack = function(id){
			SpotifyService.searchTopTracks(id)
			.then(function(res){
				$scope.track = res.data.tracks[0];
				$scope.tracks = res.data.tracks;

				audioObject.pause();
				audioObject = new Audio(res.data.tracks[0].preview_url);
                audioObject.play();
			}, function(err){
				console.log(err);
			});
		}

	    $scope.startNetwork = function(artist, reset) {
	    	$scope.artists = [];
	    	$scope.artist = artist;
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

	        network.on("click", function (params) {
	        	if(params.nodes[0] != undefined)
		        	$scope.searchSimilar(params.nodes[0]);
		    });

		    network.on("doubleClick", function (params) {
        		$scope.playTopTrack(params.nodes[0]);
    		});
	    }

	    function addSimilar(id, similar){
	    	similar.forEach(function(artist, index){
    			var edge = {from: id, to: artist.id};
    			var node = artistToNode(artist);
    			
    			if(index < 3){
	    			try{	    		
	    				nodesArray.push(node);
	    				nodes.add(node);
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

	    function existsEdge(edge){
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

	    function existsNode(node){
	    	for (var i = 0; i < nodesArray.length; i++) {
	    		if(nodesArray[i].id == node.id)
	    			return true;
	    	}

	    	return false;
	    }

	    function defaultOptions(){
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

	    $scope.playTrack = function(track){
	    	$scope.track = track;
	    	audioObject.pause();
	    	audioObject = new Audio(track.preview_url);
            audioObject.play();
            console.log(track);
	    }
	});
})();