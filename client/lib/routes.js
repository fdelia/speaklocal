(function() {
  'use strict';

  angular.module('app').config(['$urlRouterProvider', '$stateProvider',
    function($urlRouterProvider, $stateProvider) {

      $stateProvider
        .state('posts', {
          url: '/',
          templateUrl: 'client/Posts/posts.ng.html',
          controller: 'PostsCtrl',
          resolve: {}
        })
        .state('posts.detail', {
          url: 'posts/:id',
          templateUrl: 'client/Posts/posts.ng.html',
          controller: 'PostsCtrl',
          resolve: {
            'currentUser': ['$meteor', function($meteor) {
              return $meteor.requireUser();
            }]
          }
        })


      .state('notifications', {
        url: '/notifications',
        templateUrl: 'client/Notifications/notifications.ng.html',
        controller: 'NotiCtrl',
        resolve: {
          'currentUser': ['$meteor', function($meteor) {
            return $meteor.requireUser();
          }]
        }
      })


      .state('users', {
          url: '/users',
          templateUrl: 'client/Users/users.ng.html',
          controller: 'UsersCtrl',
          controllerAs: 'vm',
          resolve: {
            'currentUser': ['$meteor', function($meteor) {
              return $meteor.requireUser();
            }]
          }
        })
        .state('users.detail', {
          url: '/:id',
          templateUrl: 'client/Users/users.detail.ng.html',
          controller: 'UserCtrl'
        })


      .state('conversations', {
          url: '/messages',
          templateUrl: 'client/Conversations/conversations.ng.html',
          controller: 'ConversationsCtrl',
          resolve: {
            'currentUser': ['$meteor', function($meteor) {
              return $meteor.requireUser();
            }]
          }
        })
        .state('conversations.detail', {
          url: '/:id',
          templateUrl: 'client/Conversations/conversations.detail.ng.html',
          controller: 'ConversationsDetailCtrl',
          controllerAs: 'vm'
        })


      .state('about', {
        url: '/about', // see above
        templateUrl: 'client/About/about.ng.html',
        controller: 'AboutCtrl',
        controllerAs: 'vm'
      });

      $urlRouterProvider.otherwise('/');
    }
  ]);

  angular.module("app").run(["$rootScope", "$state", function($rootScope, $state) {
    $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
      // We can catch the error thrown when the $requireUser promise is rejected
      // and redirect the user back to the main page
      if (error === "AUTH_REQUIRED") {
        alert('please login');
        $state.go('posts');
      } else  {
        console.error(error);
      }
    });

    // $rootScope.$on('$stateChangeSuccess', function() {
    //   console.log($state.current.name);
    // });
  }]);



})();