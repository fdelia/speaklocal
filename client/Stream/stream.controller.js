(function() {
  'use strict';

  angular.module('app').controller('StreamCtrl', StreamCtrl);
  StreamCtrl.$inject = ['$scope', '$meteor', '$stateParams', 'speakLocal', '$state'];

  function StreamCtrl($scope, $meteor, $stateParams, speakLocal, $state) {
    $scope.stateParamsId = $stateParams.id; // for ng-hide

    // "pagination"/limitation of posts
    $scope.posts = [];
    var opts = {
      skip: 0,
      limit: 10 // posts per page
    }
    if ($stateParams.id) opts.limit = 0; // else post wont show
    // if only one post should be displayed, other params don't apply anymore
    if ($stateParams.id) opts.postId = $stateParams.id

    $scope.alerts = [];
    $scope.addAlert = addAlert;
    $scope.closeAlert = closeAlert;

    $scope.addComment = addComment;
    $scope.addPost = addPost;
    $scope.likeUnlikePost = likeUnlikePost;
    $scope.likeUnlikeComment = likeUnlikeComment;

    $scope.formatTime = speakLocal.timeAgo;
    $scope.isThisUser = isThisUser;
    $scope.sendMsgTo = sendMsgTo;
    $scope.loadMorePosts = loadMorePosts;
    $scope.loadPosts = loadPosts;
    $scope.hideLoadMore = hideLoadMore;

    $scope.showWelcomeMsg = showWelcomeMsg;
    // $scope.seenWelcomeMsg = seenWelcomeMsg;
    $scope.openCreateAccountDialog = openCreateAccountDialog;

    loadPosts();

    function addComment(title, text) {
      if (!$scope.currentUser) return false;
      if (!text) {
        $scope.addAlert('warning', 'Please add some text');
        return false;
      }
      Meteor.call('addComment', title, text, function(err, res) {
        $scope.$apply();
      });
    };

    function addPost(title, text) {
      if (!$scope.currentUser) return false;

      if (!title) {
        $scope.addAlert('warning', 'Please add a title');
        return false;
      }
      if (!text) {
        $scope.addAlert('warning', 'Please add some text');
        return false;
      }
      Meteor.call('addPost', title, text, function(err, res) {
        $scope.$apply();

      });
    };

    function likeUnlikePost(postId) {
      if (!$scope.currentUser) return false;
      Meteor.call('likeUnlikePostComment', 'post', postId, function(err, res) {
        $scope.$apply();
      });

      // test
      // Meteor.call('likeUnlikePost2', postId, function(err, res) {
      //   console.log(res);
      //   $scope.$apply();
      // });
    };

    function likeUnlikeComment(commentId) {
      if (!$scope.currentUser) return false;
      Meteor.call('likeUnlikePostComment', 'comment', commentId, function(err, res) {
        $scope.$apply();
      });

      // test need index to like comment   
      //  Meteor.call('likeUnlikeComment2', postId, commentIndex, function(err, res){
      //   console.log(res);
      //   $scope.$apply();
      // });
    };

    function isThisUser(userId) {
      if (!$scope.currentUser) return false;
      return userId === $scope.currentUser._id;
    };

    // unfinished, get number of remaining rows/posts from server
    function hideLoadMore() {
      return opts.skip === $scope.posts.length;
    }

    // starts a conversation if there is none, postId needed for anoProfile of user
    function sendMsgTo(userId, postId) {
      if (!$scope.currentUser) return false;
      // getConv from server
      // returns convId
      // locate to this conv
      Meteor.call('getConversation', userId, postId, function(err, res) {
        var conv = res;
        if (!conv) {
          console.error('server error');
          return;
        }
        $state.go('conversation', {
          'id': conv._id
        });
      });
    };

    var loadedWelcomeMsg = false;

    function showWelcomeMsg() {
      // if ($scope.currentUser || Session.get('seenWelcomeMsg')) return false;
      // if (!loadedWelcomeMsg)
      // $.getScript('/packages/js/jquery.tooltipster.min.js').done(function(script, textStatus){
      //   // if (c.status !== 200) return false;

      //   $('.post:first').prop('title', 'this is a post');
      //   $('.post:first').tooltipster();
      //   loadedWelcomeMsg = true;
      //   console.log('done');
      // }).fail(function(jqxhr, settings, exc){
      //   console.log(exc);
      //   console.log('failed to laod');
      // });
      // return true;
      return !$scope.currentUser && !Session.get('seenWelcomeMsg');
    }

    // function seenWelcomeMsg() {
    //   Session.setPersistent('seenWelcomeMsg', true);
    // }

    function loadMorePosts() {
      opts.skip = $scope.posts.length;
      $scope.loadPosts();
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
      // this callback thing is kind of messy

      // $meteor.subscribe('posts2', opts).then(function() {
      $meteor.subscribe('posts', opts).then(function() {
        $meteor.subscribe('comments', opts).then(function() {
          $meteor.subscribe('likes', opts).then(function() {

            $meteor.subscribe('allUserData').then(function() {
              $meteor.subscribe('anoUsers', opts).then(function() {
                $meteor.subscribe('userAnoProfiles', opts).then(function() {

                  // console.log('subbed to posts: ' + Posts.find().fetch().length);
                  // console.log('subbed to anoUsers: ' + AnonymousUsers.find().fetch().length);
                  // console.log('subbed to comments: ' + Comments.find().fetch().length);
                  // console.log('subbed to likes: ' + Likes.find().fetch().length);

                  var initialization = true;

                  // only show one post or all
                  if ($stateParams.id)
                    $scope.posts = [Posts.findOne({
                      _id: $stateParams.id
                    })];
                  else
                    $scope.posts = $scope.posts.concat(Posts.find({}, {
                      sort: {
                        'createdAt': -1
                      },
                      skip: opts.skip,
                      limit: opts.limit
                    }).fetch());


                  updateLikes(null);

                  // to add: this feature
                  $scope.posts.forEach(function(el, i) {
                    el.spam = 0;
                  });

                  Posts.find().observe({
                    // take changed because the post is updated after creation to add userId
                    changed: function(post, oldPost) {
                      // insert only if the post is new (not during initialization)
                      if (!initialization) {
                        post.comments = [];
                        // post._id = id;
                        post.spam = 0;
                        post.likes = [];
                        post.user = speakLocal.getUser(post.userId);
                        // trick to resubscribe and renew cursors (adding the new post)
                        opts.limit += 1;
                        $meteor.subscribe('comments', opts);

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

                      updateLikes(pseudoLike);

                      // trick to resubscribe and renew cursors (adding the new comment)
                      opts.limit += 1;
                      $meteor.subscribe('likes', opts);

                      if ($scope.currentUser && comment.userId !== $scope.currentUser._id) {
                        $scope.$apply();
                      }
                    }
                  });


                  Likes.find().observe({
                    added: function(likeObj) {
                      if (initialization) return false;
                      updateLikes(likeObj);
                      $scope.$apply();
                    },
                    removed: function(likeObj) {
                      if (initialization) return false;
                      updateLikes(likeObj);
                      $scope.$apply();
                    }
                  });

                  /**
                   *  It's actually an "updatePosts" since it updates everything
                   */
                  function updateLikes(likeObj) {
                    // for performance
                    if (likeObj && likeObj.type === 'comment') var likedComment = Comments.findOne({
                      _id: likeObj.on
                    });

                    function setCommentLikes(comment) {
                      var likes = Likes.find({
                        on: comment._id,
                        type: 'comment'
                      }).fetch();

                      comment.userHasLiked = 0;
                      comment.likes = likes.map(function(el) {
                        if (!el.userId) return; // unclear why this should be, maybe DB has strange inputs from dev

                        var user = speakLocal.getUser(el.userId);
                        if (!user) {
                          console.error('user not defined for comment like and userId ' + el.userId);
                          return true;
                        }
                        if (user.isUser !== undefined || ($scope.currentUser && user.username === $scope.currentUser.username)) comment.userHasLiked = 1;
                        return user.username;
                      });
                    }

                    function setPostLikes(post) {
                      var likes = Likes.find({
                        on: post._id,
                        type: 'post'
                      }).fetch();

                      post.userHasLiked = 0;
                      post.likes = likes.map(function(el) {
                        if (!el.userId) return; // unclear why this should be, maybe DB has strange inputs from dev
                        var user = speakLocal.getUser(el.userId);

                        if (!user) {
                          console.error('user not defined for post like and userId ' + el.userId);
                          return;
                        }
                        if (user.isUser !== undefined || ($scope.currentUser && user.username === $scope.currentUser.username)) post.userHasLiked = 1;
                        return user.username;
                      });
                    }


                    for (var i = 0; i < $scope.posts.length; i += 1) {
                      // for performance
                      if (likeObj && likeObj.type === 'post' && $scope.posts[i]._id !== likeObj.on) continue;

                      var post = $scope.posts[i];
                      post.user = speakLocal.getUser(post.userId);

                      post.comments = Comments.find({
                        postId: $scope.posts[i]._id
                      }).fetch();


                      for (var j = 0; j < post.comments.length; j += 1) {
                        var comment = post.comments[j];
                        if (likeObj && likeObj.type === 'comment' && $scope.posts[i]._id !== comment.postId) continue;
                        comment.user = speakLocal.getUser(comment.userId);

                        comment.likes = [];
                        setCommentLikes(comment);
                      }

                      setPostLikes(post);


                    }
                  }

                  initialization = false;
                });
              });
            });
          }); // });
        });
      });
    }
  }


})();