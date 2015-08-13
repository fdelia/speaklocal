(function() {
    'use strict';

    angular.module('app').directive('userShortcut', userShortcut);

    function userShortcut() {
        // Usage:
        // <userShortcut user="theUser" 
        //          showYou="true/false" imgOnly="true/false" 
        //          anoMode="true/false"></...>
        // user is needed
        // showYou adds (you) if its the logged in user
        // imgOnly only shows the user image / user logo
        // anoMode shows anoProfile user image

        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {
                user: '=', // same as =user
                showYou: '=',
                imgOnly: '=',
                anoMode: '='
            },
            templateUrl: 'client/directives/userShortcutTemplate.ng.html'//,

            
        }
    } 

})();