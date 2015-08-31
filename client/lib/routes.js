(function() {
  'use strict';

  angular.module('app').config(['$urlRouterProvider', '$stateProvider',
    function($urlRouterProvider, $stateProvider) {

      $stateProvider
        .state('stream', { // aka post.list
          url: '/',
          templateUrl: 'client/Stream/posts.ng.html',
          controller: 'StreamCtrl',
          resolve: {
            'subscribtion': ['speakLocalData', function(speakLocalData) {
              return speakLocalData.subscribeAll();
            }]
          }
        })
        // .state('post.list', {
        //   url: '/',
        //   templateUrl: 'client/Stream/posts.ng.html',
        //   // controller: 'StreamCtrl'/*,
        //   resolve: {
        //     'subscribtion': ['speakLocalData', function(speakLocalData) {
        //       return speakLocalData.subscribeAll();
        //     }]
        //   }

        // })
        .state('post', { // post.details
          url: '/post/:id',
          templateUrl: 'client/Stream/posts.ng.html',
          controller: 'StreamCtrl',
          resolve: {
            'currentUser': ['$meteor', function($meteor) {
              return $meteor.requireUser();
            }],
            'subscribtion': ['speakLocalData', function(speakLocalData) {
              return speakLocalData.subscribeAll();
            }]
          }
        })
        .state('notificationList', {
          url: '/notifications',
          templateUrl: 'client/Notifications/notifications.ng.html',
          controller: 'NotiCtrl',
          resolve: {
            'currentUser': ['$meteor', function($meteor) {
              return $meteor.requireUser();
            }],
            'subscribtion': ['speakLocalData', function(speakLocalData) {
              return speakLocalData.subscribeAll();
            }]
          }
        })
        .state('user', {
          url: '/user/:id',
          templateUrl: 'client/Users/user.ng.html',
          controller: 'UserCtrl',
          resolve: {
            'currentUser': ['$meteor', function($meteor) {
              return $meteor.requireUser();
            }],
            'subscribtion': ['speakLocalData', function(speakLocalData) {
              return speakLocalData.subscribeAll();
            }]
          }
        })
        .state('userList', {
          url: '/users',
          templateUrl: 'client/Users/userlist.ng.html',
          controller: 'UserListCtrl',
          controllerAs: 'vm',
          resolve: {
            'currentUser': ['$meteor', function($meteor) {
              return $meteor.requireUser();
            }],
            'subscribtion': ['speakLocalData', function(speakLocalData) {
              return speakLocalData.subscribeAll();
            }]
          }
        })
        .state('conversationList', {
          url: '/messages',
          templateUrl: 'client/Conversations/conversationList.ng.html',
          controller: 'ConversationListCtrl',
          resolve: {
            'currentUser': ['$meteor', function($meteor) {
              return $meteor.requireUser();
            }],
            'subscribtion': ['speakLocalData', function(speakLocalData) {
              return speakLocalData.subscribeAll();
            }]
          }
        })
        .state('conversation', {
          url: '/message/:id',
          templateUrl: 'client/Conversations/conversation.ng.html',
          controller: 'ConversationCtrl',
          controllerAs: 'vm',
          resolve: {
            'currentUser': ['$meteor', function($meteor) {
              return $meteor.requireUser();
            }],
            'subscribtion': ['speakLocalData', function(speakLocalData) {
              return speakLocalData.subscribeAll();
            }]
          }
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
        $state.go('stream');
      } else  {
        console.error(error);
      }
    });
  }]);

})();