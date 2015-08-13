(function() {
  'use strict';

  angular.module('app').controller('NavbarCtrl', NavbarCtrl);
  NavbarCtrl.$inject = ['$scope', '$location', '$meteor', 'speakLocal', '$document', '$state']

  function NavbarCtrl($scope, $location, $meteor, speakLocal, $document, $state) {

    $scope.routeIs = function(routeName) {
      return $location.path() === routeName;
    };

    $scope.routeIsUserlist = function() {
      if (!$scope.currentUser) return; // TODO cheap hack b\c error messages, 
      // currentUser is set too late, even if it works like this
      return ($location.path().indexOf('/user/') >= 0 && $location.path().indexOf($scope.currentUser.username) === -1) || $location.path().indexOf('/users') >= 0;
    };

    $scope.routeIsStream = function() {
      return $location.path().indexOf('/post/') >= 0 || $location.path() === '/';
    };

    $scope.routeIsMessage = function() {
      return $location.path().indexOf('/message/') >= 0 || $location.path() === '/messages';
    };

    speakLocal.getAnoMode().then(function(res) {
      $scope.anoMode = res;
    });

    $scope.switchAnoMode = function() {
      $scope.anoMode = speakLocal.switchAnoMode();
      // $scope.$apply();
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
        $state.go('stream');
      // ALT + w
      if (e.which === 8721)
        $state.go('notifications');
      // ALT + e
      if (e.which === 8364)
        $state.go('conversations');
      // ALT + r
      if (e.which === 174)
        $state.go('userlist');

    });



    // NOTIFICATIONS

    function updateNotiCounter() {
      var notifications = Notifications2.find({
        seen: 0
      }).fetch();
      $scope.notiCounter = notifications.length;
    }

    $meteor.subscribe('notifications2-new').then(function() {
      updateNotiCounter();
    });

    // update counter
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
      }
    });


    // MESSAGES

    function updateMsgCounter(id, msgObj) {
      if (initialization) return;
      $scope.msgCounter = 0;

      var userIds = speakLocal.getAllUserIdsForThisUser($scope.currentUser._id);
      var convs = Conversations.find({}).fetch();

      for (var i in convs) {
        var conv = convs[i];

        if (userIds.indexOf(conv.userId) !== -1) {
          conv.fromUserObj = speakLocal.getUser(conv.userId);
          conv.toUserObj = speakLocal.getUser(conv.toUser);
          $scope.msgCounter += conv.unseenMsgsFrom ? conv.unseenMsgsFrom : 0;
        }
        if (userIds.indexOf(conv.toUser) !== -1) {
          conv.fromUserObj = speakLocal.getUser(conv.toUser);
          conv.toUserObj = speakLocal.getUser(conv.userId);
          $scope.msgCounter += conv.unseenMsgsTo ? conv.unseenMsgsTo : 0;
        }
      }
    }

    $meteor.subscribe('conversations-new').then(function() {
      $meteor.subscribe('anoUsers').then(function() {
        $meteor.subscribe('userAnoProfiles').then(function() {
          initialization = false;
          updateMsgCounter();
        });
      });
    });


    Conversations.find().observe({
      added: function(newDoc, oldDoc) {
        updateMsgCounter();
        $scope.$apply();
      },
      changed: function(newDoc, oldDoc) {
        updateMsgCounter();
        $scope.$apply();
      }
    })

  }

})();