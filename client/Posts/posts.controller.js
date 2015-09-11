(function() {
  'use strict';

  angular.module('app').controller('PostsCtrl', PostsCtrl);
  PostsCtrl.$inject = ['$scope', 'speakLocal', '$state', 'PostsService'];

  function PostsCtrl($scope, speakLocal, $state, PostsService) {
    $scope.stateParamsId = $state.params.id; // for ng-hide

    // "pagination"/limitation of posts
    $scope.posts = [];
    var opts = {
      skip: 0,
      limit: 10 // posts per page
    }
    if ($state.params.id) opts.limit = 0; // else post wont show

    $scope.alerts = [];
    $scope.addAlert = addAlert;
    $scope.closeAlert = closeAlert;

    $scope.addComment = addComment;
    $scope.addPost = addPost;
    $scope.likeUnlikePost = likeUnlikePost;
    $scope.likeUnlikeComment = likeUnlikeComment;

    $scope.timeAgo = speakLocal.timeAgo;
    $scope.isThisUser = isThisUser;
    $scope.sendMsgTo = sendMsgTo;
    $scope.loadMorePosts = loadMorePosts;

    $scope.showWelcomeMsg = showWelcomeMsg;
    $scope.openCreateAccountDialog = openCreateAccountDialog;
    $scope.showLoadMoreButton = true;

    var loadingPosts = true;
    loadPosts();

    function addComment(postId, text) {
      if (!$scope.currentUser) return false;

      PostsService.addComment(postId, text)
        .then(function(data) {

        }, function(err) {
          $scope.addAlert('warning', err);
        });

    };

    function addPost(title, text) {
      if (!$scope.currentUser) return false;

      PostsService.addPost(title, text)
        .then(function(data) {
          // TODO rest form (current solution not optimal (eg. if an error occurs, input is lost))
          $scope.title = '';
          $scope.text = '';
          // $scope.newPost.$setPristine();
        }, function(err) {
          $scope.addAlert('warning', err);
        });

    };

    function likeUnlikePost(postId) {
      if (!$scope.currentUser) return false;

      PostsService.likeUnlikePost(postId)
        .then(function(data) {

        }, function(err) {
          $scope.addAlert('warning', err);
        });
    };

    function likeUnlikeComment(commentId) {
      if (!$scope.currentUser) return false;

      PostsService.likeUnlikeComment(commentId)
        .then(function(data) {

        }, function(err) {
          $scope.addAlert('warning', err);
        });

    };

    function isThisUser(userId) {
      if (!$scope.currentUser) return false;
      return userId === $scope.currentUser._id;
    };

    // starts a conversation if there is none, postId needed for anoProfile of user
    function sendMsgTo(userId, postId) {
      if (!$scope.currentUser) return false;

      PostsService.getConversation(userId, postId)
        .then(function(data) { // data = conversation
          $state.go('conversations.detail', {
            'id': data._id
          })
        }, function(err) {
          $scope.addAlert('warning', err);
        });
    };


    function showWelcomeMsg() {
      return !$scope.currentUser; //&& !Session.get('seenWelcomeMsg');
    }

    // function seenWelcomeMsg() {
    //   Session.setPersistent('seenWelcomeMsg', true);
    // }


    function loadMorePosts() {
      opts.skip = $scope.posts.length;
      if (!loadingPosts) loadPosts();
    };

    function openCreateAccountDialog() {
      $('#login-sign-in-link').click();
      setTimeout(function() {
        $('#signup-link').click();
      }, 300);
    }

    // updates when switching anoMode (from navbarController)
    $scope.$watch(function() {
      return speakLocal.anoMode;
    }, function(newVal, oldVal) {
      $scope.anoMode = newVal;
    });

    function addAlert(type, msg) {
      $scope.alerts.push({
        type: type,
        msg: msg
      });
    };

    function closeAlert(index) {
      $scope.alerts.splice(index, 1);
    };

    function loadPosts() {
      // load one more to see if there is more
      var opts2 = _.clone(opts); // clone to leave original unchanged
      opts2.limit += 1;
      // this is a hack to prohibit two subscribtions going on at once, it messes up the received data. it may be a bug
      loadingPosts = true;

      PostsService.loadPosts2($state.params.id, opts2)
        .then(function(data) {
          loadingPosts = false;

          // var posts = $scope.posts.concat(PostsService.loadPosts($state.params.id, opts2));
          var posts = $scope.posts.concat(data);
          if (!$state.params.id && opts.limit && posts.length > opts.limit) {
            // remove the last one only if we have loaded one too much
            posts = posts.slice(0, -1);
            $scope.showLoadMoreButton = true;
          } else $scope.showLoadMoreButton = false;

          $scope.posts = PostsService.updatePosts(posts, null, $scope.currentUser);
        });
    }



    // OBSERVATIONS

    var initialization = true;

    Posts.find().observe({
      // added: function(post) {
      //   if ($scope.posts.length <= 10)
      //     $scope.posts = $scope.posts.concat(post);
      // },


      // take changed because the post is updated after creation to add userId
      changed: function(post, oldPost) {
        // insert only if the post is new (not during initialization)
        if (!initialization) {
          post.comments = [];
          // post._id = id;
          post.spam = 0;
          post.likes = [];
          post.user = speakLocal.getUser(post.userId, true);

          // Problem: see Comments observeChanges added
          $scope.posts.splice(0, 0, post);
          if ($scope.currentUser && post.userId !== $scope.currentUser._id)
            $scope.$apply();

        }
      }
    });

    Comments.find().observeChanges({
      added: function(id, comment) {
        // Problem: doesn't automatically add for the adding user in an other window/tab
        // because there it should be $scope.$apply, but it shouldnt be $apply
        // in the window where the user writes the comment
        if (initialization) return false;

        var pseudoLike = {
          type: 'post',
          on: comment.postId
        };

        PostsService.updatePosts($scope.posts, pseudoLike, $scope.currentUser);

        if ($scope.currentUser && comment.userId !== $scope.currentUser._id) {
          $scope.$apply();
        }
      }
    });


    Likes.find().observe({
      added: function(likeObj) {
        if (initialization) return false;
        PostsService.updatePosts($scope.posts, likeObj, $scope.currentUser);
        $scope.$apply();
      },
      removed: function(likeObj) {
        if (initialization) return false;
        PostsService.updatePosts($scope.posts, likeObj, $scope.currentUser);
        $scope.$apply();
      }
    });

    initialization = false;

  }


})();