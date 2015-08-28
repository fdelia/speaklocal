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
      // same as on server in publish 'notifications2-new'
      var notifications = Notifications2.find({
        // to: this.userId,
        seen: 0
      }).fetch();
      $scope.notiCounter = notifications.length;

      // it makes no sense to do it with a method call: 
      // since the subscribtion to the collection has to be done anyway for .observeChanges()

      // Meteor.call('countNewNotifications', function(err, res) {
      //   if (err) {
      //     console.error(err);
      //   } else {
      //     $scope.notiCounter = res;
      //   }
      // });
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


    // CONVERSATIONS

    function updateNewConvCounter(id, msgObj) {
      if (initialization) return;
      $scope.msgCounter = 0;

      var userIds = speakLocal.getAllUserIdsForThisUser($scope.currentUser._id);
      // var convs = Conversations.find({}).fetch();

      // same as on server in publish 'conversations-new'
      var convs = Conversations.find({
        $or: [{
          userId: {
            $in: userIds
          },
          unseenMsgsFrom: {
            $gt: 0
          }
        }, {
          toUser: {
            $in: userIds
          },
          unseenMsgsTo: {
            $gt: 0
          }
        }]
      }).fetch();


      convs.map(function(conv) {

        if (userIds.indexOf(conv.userId) !== -1)
          $scope.msgCounter += conv.unseenMsgsFrom ? 1 : 0;

        if (userIds.indexOf(conv.toUser) !== -1)
          $scope.msgCounter += conv.unseenMsgsTo ? 1 : 0;

      });

    }

    $meteor.subscribe('conversations-new').then(function() {
      $meteor.subscribe('anoUsers').then(function() {
        $meteor.subscribe('userAnoProfiles').then(function() {
          initialization = false;
          updateNewConvCounter();
        });
      });
    });


    Conversations.find().observe({
      added: function(newDoc, oldDoc) {
        updateNewConvCounter();
        $scope.$apply();
      },
      changed: function(newDoc, oldDoc) {
        updateNewConvCounter();
        $scope.$apply();
      }
    })

  }

})();