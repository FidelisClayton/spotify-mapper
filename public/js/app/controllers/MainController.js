(function(){
    "use strict";
    
    angular.module('SpotifyMapper').controller('MainController', function($scope, SpotifyService, Spotify, $cookies, $timeout){
        var nodeIds, shadowState, nodesArray, nodes, edgesArray, edges, network;
        var audioObject = new Audio();

        if($cookies.get('token') != undefined){
            if($cookies.get('user') != undefined)
                $scope.user = JSON.parse($cookies.get('user'));
        }
        
        $scope.showTutorial = true;
        $scope.modal = {};
        $scope.ui = {};
        $scope.playing = false;
        $scope.trackIndex = 0;

        var playlistArtists = [];
        $scope.playlist = [];

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

        $scope.login = function () {
            Spotify.login().then(function (data) {
                $scope.token = data;
                $cookies.put('token', $scope.token);
                Spotify.getCurrentUser()
                .then(function (data) {
                    $scope.user = data;
                    $cookies.put('user', JSON.stringify($scope.user));
                })
            }, function () {
                console.log('didn\'t log in');
            })
        };

        $scope.search = function(query){
            Spotify.search(query, 'artist').then(function (data) {
                $scope.artists = data.artists.items;
                $scope.artist = $scope.artists[0];
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
            $scope.trackIndex = 0;
            Spotify
            .getArtistTopTracks(id, 'BR')
            .then(function (data) {
                $scope.track = data.tracks[$scope.trackIndex];
                $scope.tracks = data.tracks;

                $timeout(() => {
                    audioObject.onended = function() {
                        if($scope.trackIndex < $scope.tracks.length) {
                            $scope.trackIndex++;
                            $scope.track = $scope.tracks[$scope.trackIndex];

                            $scope.playTrack($scope.track);
                        }

                        console.log($scope.trackIndex);
                    }
                }, 5000);

                audioObject.pause();
                audioObject = new Audio(data.tracks[0].preview_url);
                audioObject.play();
                $scope.playing = true;
            });
        }

        $scope.createPlaylist = function(playListName){
            Array.prototype.shuffle = function() {
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
            .then(function (data) {
                $scope.playlistId = data.id;
            })
            .then(function(){
                Spotify
                .addPlaylistTracks($scope.user.id, $scope.playlistId, $scope.playlist.shuffle())
                .then(function (data) {
                    $scope.ui.loading = false;
                    $scope.modal.message = "Playlist criada com sucesso!";
                    $scope.showModal();
                });
            })
        }

        $scope.getTopTracks = function(id){
            function existArtistInPlaylist(artist){
                for (var i = 0; i < playlistArtists.length; i++) {
                    if(playlistArtists[i] === artist.id){
                        return true;
                    }
                }
                return false;
            }

            Spotify
            .getArtistTopTracks(id, 'BR')
            .then(function (data) {
                var tracks = data.tracks;

                if(!existArtistInPlaylist(data.tracks[0].artists[0])){
                    playlistArtists.push(data.tracks[0].artists[0].id);

                    tracks.forEach(function(track, index){
                        if(index < 3){
                            $scope.playlist.push(track.uri);
                        }
                    });
                }
            });
        }

        $scope.startNetwork = function(artist, reset) {
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

            network.on("click", function (params) {
                if(params.nodes[0] != undefined){
                    $scope.searchSimilar(params.nodes[0]);
                    $scope.getTopTracks(params.nodes[0]);
                }
            });

            network.on("doubleClick", function (params) {
                $scope.playTopTrack(params.nodes[0]);
            });
        }

        function addSimilar(id, similar){
            similar.forEach(function(artist, index){
                function existArtistInPlaylist(artist){
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
                            .then(function (data) {
                                var tracks = data.tracks;

                                playlistArtists.push(data.tracks[0].artists[0].id);

                                tracks.forEach(function(track, index){
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

        function setNodeEdges(node, edges){
            for (var i = 0; i < nodesArray.length; i++) {
                if(node.id == nodesArray[i].id){
                    nodesArray[i].edges = edges;
                }
            }
        }

        function countNodeEdges(node){
            for (var i = 0; i < nodesArray.length; i++) {
                if(node.id == nodesArray[i].id){
                    return nodesArray[i].edges;
                }
            }

            return 0;
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
            $scope.playing = true;

            $timeout(() => {
                audioObject.onended = function() {
                    $scope.stopTrack();
                    if($scope.trackIndex < $scope.tracks.length - 1) {
                        $scope.trackIndex++;
                        $scope.track = $scope.tracks[$scope.trackIndex];

                        $scope.playTrack($scope.track);
                    } else {
                        $scope.playing = false;
                    }
                }
            }, 5000);
        };

        $scope.stopTrack = function() {
            $scope.playing = false;
            audioObject.pause();
        }

        $scope.continueTrack = function() {
            $scope.playing = true;
            audioObject.play();
        }

        $scope.hideModalPlaylist = function(){
            $('#modalPlaylist').modal('hide');
        }

        $scope.showModalPlaylist = function(){
            $('#modalPlaylist').modal('show');
        }

        $scope.showModal = function(){
            $('#modal').modal('show');
        }

        $scope.hideModal = function(){
            $('#modal').modal('hide');
        }
    });
})();
