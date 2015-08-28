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

  /*
   * don't allow any inserts/updates/removes from client, deny all
   */
  // UserImages.allow({
  //   download: function() {
  //     return true;
  //   }
  // });


  /*
   *  From here the solution is very unsatisfying:
   *  I tried to put the whole logic which computes what data is needed on the server.
   *  Sure, it's the high-performance method, but it's not readable and error-prone.
   *  I think the better way would be to use publish/subscribe as simple API and put the
   *  data logic on the client side.
   */
  // TODO make more DRY

  var SLCollection;

  SLCollection = (function() {
    function SLCollection() {
      this.postsCursor = null;
      this.likesCursor = null;
      this.anoUsersCursor = null;
      this.userAnoProfilesCursor = null;
      this.nofisCursor = null;
      this.conversationsCursor = null;
      this.opts = null;
      this.view = null;
      this.userId = null;
      this.postId = null;
    }

    SLCollection.prototype.postsForStream = function(opts, userId) {
      // default options
      opts = _.extend({
        skip: 0,
        limit: 30
      }, opts);

      if (this.view === 'stream' && this.opts && userId && this.opts.skip === opts.skip && this.opts.limit === opts.limit && this.userId === userId) {
        console.log('already set: forstream');
        return;
      }

      this.opts = opts;
      this.userId = userId;
      this.view = 'stream';

      this.postsCursor = Posts.find({}, {
        sort: {
          'createdAt': -1
        },
        skip: opts.skip,
        limit: opts.limit
      });

      var postIds = this.postsCursor.fetch().map(function(obj) {
        return obj._id;
      });

      this.commentsCursor = Comments.find({
        postId: {
          $in: postIds
        }
      });

      var commentIds = this.commentsCursor.fetch().map(function(obj) {
        return obj._id;
      });

      var allIds = postIds.concat(commentIds);

      this.likesCursor = Likes.find({
        on: {
          $in: allIds
        }
      });

      this.anoUsersCursor = AnonymousUsers.find({
        talkgOnPost: {
          $in: postIds
        }
      }, {
        fields: {
          isUser: 0,
          createdAt: 0
        }
      });

      // TODO limit them too
      this.userAnoProfilesCursor = AnonymousUsers.find({
        isUser: this.userId
      }, {
        fields: {
          createdAt: 0 // not necessary
        }
      });

    }

    SLCollection.prototype.postsById = function(postId, userId) {
      if (this.view === 'byId' && this.postId && this.postId === postId && this.userId === userId) {
        console.log('already set: byid');
        return;
      }

      this.postId = postId;
      this.userId = userId;
      this.view = 'byId';

      this.postsCursor = Posts.find({
        _id: postId
      }, {
        sort: {
          'createdAt': -1
        }
      });

      if (!this.postsCursor) return; // error
      this.commentsCursor = Comments.find({
        postId: postId
      });

      var commentIds = this.commentsCursor.fetch().map(function(obj) {
        return obj._id;
      });

      commentIds.push(postId);
      var allIds = commentIds;

      this.likesCursor = Likes.find({
        on: {
          $in: allIds
        }
      });

      this.anoUsersCursor = AnonymousUsers.find({
        talkgOnPost: postId
      }, {
        fields: {
          isUser: 0,
          createdAt: 0
        }
      });

      // TODO limit them too
      this.userAnoProfilesCursor = AnonymousUsers.find({
        isUser: this.userId
      }, {
        fields: {
          createdAt: 0 // not necessary
        }
      });
    }
    SLCollection.prototype.byUserActivity = function(opts, userId) {
      if (this.view === 'userActivity' && this.opts && userId && this.opts.userId === opts.userId && this.opts.limit === opts.limit && this.opts.skip === opts.skip && this.userId === userId) {
        console.log('already set: byUserActivity');
        return;
      }

      this.opts = opts;
      this.userId = userId;
      this.view = 'userActivity';

      // TODO
    }
    SLCollection.prototype.forNotifications = function(opts, userId) {
      // TODO if

      this.opts = opts;
      this.userId = userId;
      this.view = 'notifs';

      // TODO
    }
    SLCollection.prototype.forConversations = function(opts, userId) {
      // default options
      opts = _.extend({
        skip: 0,
        limit: 20
      }, opts);

      if (this.view === 'conversations' && this.userId === userId &&
        this.opts.skip === opts.skip && this.opts.limit === opts.limit) {
        console.log('already set: forConversations');
        return;
      }

      this.opts = opts;
      this.userId = userId;
      this.view = 'conversations';


      this.conversationsCursor = Conversations.find({
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
        skip: opts.skip,
        limit: opts.limit,
        sort: {
          'updatedAt': -1
        }
      });

      // TODO
      // for every conv publish user/anoUser of userId and toUser
      // and also userAnoProfiles (with isUser set)
    }
    SLCollection.prototype.publishEverything = function(userId) {
      console.log('publish everything');
      if (this.userId === userId && this.view == 'all') return;

      this.userId = userId;
      this.view = 'all';

      this.postsCursor = Posts.find();
      this.commentsCursor = Comments.find();
      this.likesCursor = Likes.find();
      this.notifsCursor = Notifications2.find({
        to: this.userId
      });

      this.anoUsersCursor = AnonymousUsers.find({}, {
        fields: {
          isUser: 0,
          createdAt: 0
        }
      });

      this.userAnoProfilesCursor = AnonymousUsers.find({
        isUser: this.userId
      }, {
        fields: {
          createdAt: 0 // not necessary
        }
      });
    }

    SLCollection.prototype.setCursors = function(opts, userId) {

      if (opts && opts.postId) {
        this.postsById(opts.postId, userId);
      } else if (opts && opts.userId) {
        this.byUserActivity(opts, userId);
      } else if (opts && opts.view === 'notifications') {
        this.forNotifications(opts, userId);
      } else if (opts && opts.limit !== undefined && opts.skip !== undefined) {
        this.postsForStream(opts, userId);
      } else {
        this.publishEverything(userId);
      }

    }

    return SLCollection;

  })();

  var SLC = new SLCollection();

  // no user identification needed for these

  // i'm really unsure if this is a good solution, it's pretty messy
  Meteor.publish('posts', function(opts) {
    SLC.setCursors(opts, this.userId);
    return SLC.postsCursor;
    // return Posts.find();
  });

  Meteor.publish('comments', function(opts) {
    SLC.setCursors(opts, this.userId);
    return SLC.commentsCursor;
    // return Comments.find();
  });

  Meteor.publish('likes', function(opts) {
    SLC.setCursors(opts, this.userId);
    return SLC.likesCursor;
    // return Likes.find();
  });

  Meteor.publish('anoUsers', function(opts) {
    // return AnonymousUsers.find({}, {
    //   fields: {
    //     isUser: 0,
    //     createdAt: 0
    //   }
    // });
    SLC.setCursors(opts, this.userId);
    return SLC.anoUsersCursor;
  });

  Meteor.publish('allUserData', function() {
    return Meteor.users.find({}, {
      fields: {
        'username': 1,
        // 'emails': 1,
        'profile': 1
      }
    });
  });

  // user identification needed from here

  // publish to anonymous profiles of the user, to recognice what the user owns
  // the only difference is that these profiles have the field isUser set
  Meteor.publish('userAnoProfiles', function(opts) {
    // return AnonymousUsers.find({
    //   isUser: this.userId
    // }, {
    //   fields: {
    //     createdAt: 0 // not necessary
    //   }
    // });
    SLC.setCursors(opts, this.userId);
    return SLC.userAnoProfilesCursor;
  });


  Meteor.publish('userData', function() {
    return Meteor.users.find({
      _id: this.userId
    }, {
      fields: {
        'profile.bio': 1
      }
    });
  });



  Meteor.publish('conversations', function() {
    if (!this.userId) return null;
    var userIds = getAllUserIdsForUser(this.userId);

    return Conversations.find({
      // $and: [{
      $or: [{
        userId: {
          $in: userIds
        }
      }, {
        toUser: {
          $in: userIds
        }
      }]
    });
  });

  Meteor.publish('conversations-new', function() {
    if (!this.userId) return null;
    var userIds = getAllUserIdsForUser(this.userId);

    // only convs with unseenMsg > 0
    return Conversations.find({
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
    });
  });



  Meteor.publish('messages', function() {
    if (!this.userId) return null;

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
    });
  });


  /*
   *   This would be the other approach for sub/publishing. However...
   *   It is more legible, but the client does more work (to find out which data the client needs).
   *   E.g. : Liking; the client needs to get the id's of all liked posts/comments to subscribe to them.
   *          That would be easy to find out on the server side, when the server knows what the client needs (which view).
   *   This approach lets the client do multiple requests.
   */

  Meteor.publish('posts-byUser', function(opts) {
    if (!opts || !opts.userId) {
      this.error(new Meteor.Error('missing-arguments', 'Publishing posts by user, but no userId given'));
    }
    var user = Meteor.users.findOne({
      _id: opts.userId
    });
    if (!user) {
      // throw error
    }
    if (!parseInt(opts.limit)) opts.limit = 20;

    return Posts.find({
      userId: opts.userId
    }, {
      limit: opts.limit
    });
  });


  Meteor.publish('comments-byUser', function(opts) {
    if (!opts || !opts.userId)
      this.error(new Meteor.Error('missing-arguments', 'Publishing comments by user, but no userId given'));

    var user = Meteor.users.findOne({
      _id: opts.userId
    });
    if (!user) {
      // throw error
    }
    if (!parseInt(opts.limit)) opts.limit = 20;

    return Comments.find({
      userId: opts.userId
    }, {
      limit: opts.limit
    });
  });



  Meteor.publish('likes-byUser', function(opts) {
    // throwing error doesnt work...? (neither on client nor server side)
    if (!opts || !opts.userId)
      this.error(new Meteor.Error('missing-arguments', 'Publishing likes by user, but no userId given'));

    var user = Meteor.users.findOne({
      _id: opts.userId
    });
    if (!user)
      this.error(new Meteor.Error('illegal-arguments', 'User not found for userId'));

    if (!parseInt(opts.limit)) opts.limit = 20;

    return Likes.find({
      userId: opts.userId
    }, {
      limit: opts.limit
    });
  });



  // Meteor.publish('likes-onUser', function(opts) {
  //   if (!opts || opts.userId)
  //     this.error(new Meteor.Error('missing-arguments', 'Publishing likes by user, but no userId given'));



  //   return Likes.find({

  //   });
  // });


  Meteor.publish('notifications2', function() {
    if (!this.userId) return null;

    return Notifications2.find({
      to: this.userId
    });
  });

  Meteor.publish('notifications2-new', function() {
    if (!this.userId) return null;

    return Notifications2.find({
      to: this.userId,
      seen: 0
    });
  });


  // *** DEV ***
  // test
  // Meteor.publish('posts2', function(opts) {
  //   if (!opts) opts = {};
  //   if (!opts.skip) opts.skip = 0;
  //   if (!opts.limit) opts.limit = 20;


  //   return Posts2.find({}, {
  //     sort: {
  //       'createdAt': -1
  //     },
  //     skip: opts.skip,
  //     limit: opts.limit
  //   });
  // });



})();