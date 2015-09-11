(function() {
  'use strict';



  function getAllUserIdsForUser(userId) {
    var userIds = AnonymousUsers.find({
      isUser: userId
    }).fetch().map(function(obj) {
      return obj._id;
    });

    userIds.push(userId);
    return userIds;
  }

  function isInt(value) {
    if (isNaN(value)) {
      return false;
    }
    var x = parseFloat(value);
    return (x | 0) === x;
  }

  function valInt(n) {
    return isInt(n) ? (n | 0) : 0;
  }



  // no user identification needed for these

  // TODO add limit, in a non-messy way

  Meteor.publish('posts', function(limit) {
    limit = valInt(limit);

    return Posts.find({}, {
      // limit: limit,
      sort: {
        createdAt: -1
      },
      fields: {
        userId: 1,
        title: 1,
        text: 1,
        createdAt: 1,
        likes: 1
      }
    });
  });


  Meteor.publish('comments', function(limit) {
    limit = valInt(limit);

    return Comments.find({}, {
      // limit: limit,
      sort: {
        createdAt: 1
      }
    });
  });

  Meteor.publish('likes', function(limit) {
    limit = valInt(limit);

    return Likes.find({}, {
      // limit: limit,
      fields: {
        createdAt: 0
      }
    });
  });

  Meteor.publish('anoUsers', function() {
    return AnonymousUsers.find({}, {
      fields: {
        isUser: 0, // IMPORTANT! isUser should not be sent (private information)
        createdAt: 0
      },
      sort: {
        createdAt: -1
      }
    });
  });

  Meteor.publish('allUserData', function() {
    return Meteor.users.find({}, {
      fields: {
        'username': 1,
        // 'emails': 1, // dev only
        'profile': 1
      }
    });
  });

  // user identification needed from here

  // publish to anonymous profiles of the user, to recognice what the user owns
  // the only difference is that these profiles have the field isUser set
  Meteor.publish('userAnoProfiles', function(opts) {
    return AnonymousUsers.find({
      // !this one has to be set and will be sent!
      isUser: this.userId
    }, {
      fields: {
        createdAt: 0 // not necessary
      },
      sort: {
        createdAt: -1
      }
    });
  });


  Meteor.publish('userData', function() {
    return Meteor.users.find({
      _id: this.userId
    }, {
      fields: {
        'profile': 1
      }
    });
  });



  Meteor.publish('conversations', function(limit) {
    if (!this.userId) {
      this.error(Meteor.Error('not-allowed', 'please log in'));
      return null;
    }
    var userIds = getAllUserIdsForUser(this.userId);
    limit = valInt(limit);

    return Conversations.find({
      $or: [{
        userId: {
          $in: userIds
        }
      }, {
        toUser: {
          $in: userIds
        }
      }]
    }, {
      // limit: limit,
      sort: {
        updatedAt: -1
      },
      fields: {
        fromUserObj: 0,
        toUserObj: 0,
        createdAt: 0
      }
    });
  });


  Meteor.publish('messages', function() {
    if (!this.userId) {
      this.error(Meteor.Error('not-allowed', 'please log in'));
      return null;
    }

    var userIds = getAllUserIdsForUser(this.userId);

    return Messages.find({
      $or: [{
        userId: {
          $in: userIds
        }
      }, {
        toUser: {
          $in: userIds
        }
      }]
    }, {
      sort: {
        createdAt: 1
      }
    });
  });



  Meteor.publish('notifications2', function(limit) {
    if (!this.userId) {
      this.error(Meteor.Error('not-allowed', 'please log in'));
      return null;
    }
    limit = valInt(limit);

    return Notifications2.find({
      to: this.userId
    }, {
      // limit: limit
    });
  });



  // NEW WITHOUT HACK bc. of performance issues

  /*

  subscribe to:
  posts
  post -> users / anoUsers
  post -> likes
  post -> like -> users / anoUsers
  post -> comments
  post -> comment -> users / anoUsers
  post -> comment -> likes
  post -> comment -> like -> users / anoUsers


  */


  function anyUserWithId(id, _this) {
    if (typeof id !== 'string') var matchId = {$in: id};
    else var matchId = id;

    var userCursor = Meteor.users.find({
      _id: matchId
    }, {
      fields: {
        'username': 1,
        // 'emails': 1, // dev only
        'profile': 1
      }
    });

    if (userCursor.fetch().length > 0) return userCursor;

    // the difference between this and the next cursor is
    // that the field userId is only sent when userId == this.userId (from the logged in user)
    userCursor = AnonymousUsers.find({
      _id: matchId
    }, {
      fields: {
        isUser: 0, // IMPORTANT! isUser should not be sent (private information)
        createdAt: 0
      },
      sort: {
        createdAt: -1
      }
    });

    if (userCursor.fetch().length > 0) return userCursor;

    // if user not logged in
    if (!_this.userId) {
      console.error('no thisUserId given');
      _this.error(Meteor.Error('not-allowed', 'please log in'));
      return;
    }

    userCursor = AnonymousUsers.find({
      // !this one has to be set and will be sent!
      isUser: _this.userId,
      _id: matchId
    }, {
      fields: {
        createdAt: 0 // not necessary
      },
      sort: {
        createdAt: -1
      }
    });

    // console.log(userCursor.fetch().length);
    return userCursor;
  }

  function likesOnId(id) {
    return Likes.find({
      on: id
    }, {
      fields: {
        createdAt: 0
      }
    });
  }

  // function elOfNoti(noti){

  // }


  // state "posts" and "posts.detail"
  Meteor.publishComposite('lastPosts', function(skip, limit, postId) {
    return {
      // posts
      find: function() {
        skip = valInt(skip);
        limit = valInt(limit);

        var params = {};

        if (postId) params = {
          _id: postId
        };

        return Posts.find(params, {
          skip: skip,
          limit: limit,
          sort: {
            createdAt: -1
          },
          fields: {
            userId: 1,
            title: 1,
            text: 1,
            createdAt: 1,
            likes: 1
          }
        });
      },

      children: [{
          // post -> users
          find: function(post) {
            return anyUserWithId(post.userId, this);
          }
        }, {
          // post -> likes
          find: function(post) {
            return likesOnId(post._id);
          },
          children: [{
            // post -> like -> users
            find: function(like) {
              return anyUserWithId(like.userId, this);
            }
          }]
        },

        {
          // post -> comments
          find: function(post) {
            return Comments.find({
              postId: post._id
            }, {
              sort: {
                createdAt: 1
              }
            });
          },
          // post -> comment -> likes
          children: [{
            find: function(comment) {
              return likesOnId(comment._id);
            },
            children: [{
              // post -> comment -> like -> users
              find: function(like) {
                return anyUserWithId(like.userId, this);
              }
            }]
          }, {
            // post -> comment -> users
            find: function(comment) {
              return anyUserWithId(comment.userId, this);
            }
          }]
        }
      ]
    }
  });

  // state "notifications"
  Meteor.publishComposite('lastNotifications', function(skip, limit) {
    return {
      // notifications
      find: function() {
        if (!this.userId) {
          this.error(Meteor.Error('not-allowed', 'please log in'));
          return null;
        }
        skip = valInt(skip);
        limit = valInt(limit);

        return Notifications2.find({
          to: this.userId
        }, {
          // skip: skip,
          limit: limit,
          sort: {
            'updatedAt': -1
          }
        });
      },
      children: [{
        // noti -> element(post/comment)
        find: function(noti) {
          switch (noti.type) {
            case 'comment':
            case 'likeComment':
              return Comments.find({
                _id: noti.on
              }, {});
            case 'likePost':
              return Posts.find({
                _id: noti.on
              }, {});
            default:
              return null;
          }
        }
      }, {
        // noti -> user
        find: function(noti){
          return anyUserWithId(noti.userIds, this);
        }
      }]
    }
  });


  // state "conversations" and "conversations.detail"


  // state "users" and "users.detail"




})();