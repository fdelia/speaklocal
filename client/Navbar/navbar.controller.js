(function() {
  'use strict';

  angular.module('app').controller('NavbarCtrl', NavbarCtrl);
  NavbarCtrl.$inject = ['$scope', '$document', '$state', 'speakLocalData', 'NavbarService']

  function NavbarCtrl($scope, $document, $state, speakLocalData, NavbarService) {
    $scope.routeIsUserlist = function() {
      if (!$scope.currentUser) return; // TODO cheap hack b\c error messages
      // currentUser is set too late, even if it works like this
      return $state.current.name === 'users' || $state.current.name === 'users.detail' && $state.params.id !== $scope.currentUser.username;
      // return ($location.path().indexOf('/user/') >= 0 && $location.path().indexOf($scope.currentUser.username) === -1) || $location.path().indexOf('/users') >= 0;
    };

    $scope.routeIsCurrentUser = function(){
      if (!$scope.currentUser) return; // TODO cheap hack b\c error messages, 
      return $state.current.name === 'users.detail' && $state.params.id === $scope.currentUser.username;
    }

    NavbarService.getAnoMode().then(function(res) {
      $scope.anoMode = res;
    });

    $scope.switchAnoMode = function() {
      $scope.anoMode = NavbarService.switchAnoMode();
      console.log('anoMode set to ' + $scope.anoMode);
    };


    // added keyEvents here because of $scope.switchAnoMode(); it should be in a directive actually
    $document.bind('keypress', function(e) {
      // console.log('Got keypress:', e.which);
      // $rootScope.$broadcast('keypress', e);
      // $rootScope.$broadcast('keypress:' + e.which, e);

      // ALT + a
      if (e.which === 229) {
        $scope.switchAnoMode();
        $scope.$apply();
      }
      // ALT + q
      if (e.which === 339)
        $state.go('posts');
      // ALT + w
      if (e.which === 8721)
        $state.go('notifications');
      // ALT + e
      if (e.which === 8364)
        $state.go('conversations');
      // ALT + r
      if (e.which === 174)
        $state.go('users');

    });



    // RED BULLET POINTS

    // subscribe here since there is no 'resolve' - navbar is no state
    speakLocalData.subscribeAll()
      .then(function(data) {

        var initialization = true; // wegen $apply
        Notifications2.find({
          seen: 0
        }).observeChanges({
          added: function() {
            if (!initialization) {
              updateNotiCounter();
              $scope.$apply();
            }
          },
          removed: function() {
            if (!initialization)
              updateNotiCounter();
              $scope.$apply();
          }
        });

        Conversations.find().observe({
          added: function(newDoc, oldDoc) {
            if (!initialization) {
              updateNewConvCounter();
              $scope.$apply();
            }
          },
          changed: function(newDoc, oldDoc) {
            if (!initialization) {
              updateNewConvCounter();
              $scope.$apply();
            }
          }
        });

        initialization = false;

        updateNotiCounter();
        updateNewConvCounter();

      }, function(err) {

      });

    function updateNotiCounter() {
      $scope.notiCounter = NavbarService.returnNotiCounter();
    }

    function updateNewConvCounter() {
      $scope.msgCounter = NavbarService.returnNewConvCounter($scope.currentUser._id);
    }


  }

})();