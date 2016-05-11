(function(){
    "use strict";

    angular.module('SpotifyMapper', ['angular-loading-bar', 'angucomplete-alt', 'spotify', 'ngCookies']);
    
    angular.module('SpotifyMapper').config(function(cfpLoadingBarProvider, SpotifyProvider) {
        var $cookies;

        angular.injector(['ngCookies']).invoke(['$cookies', function(_$cookies_) {
            $cookies = _$cookies_;
        }]);

        cfpLoadingBarProvider.includeSpinner = false;
        SpotifyProvider.setClientId('8bca6dd295154108baa9485fddd1e4f1');
        // SpotifyProvider.setRedirectUri('https://spotify-mapper.herokuapp.com/callback.html');
        SpotifyProvider.setRedirectUri('http://localhost:3000/callback.html');
        SpotifyProvider.setScope('user-read-private playlist-read-private playlist-modify-private playlist-modify-public');
        if($cookies.get('token') != undefined)
            SpotifyProvider.setAuthToken($cookies.get('token'));
    });
})();
