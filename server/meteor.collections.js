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



  // no user identification needed for these

  // TODO add limit, in a non-messy way

  Meteor.publish('posts', function(limit) {
    limit = parseInt(limit) ? parseInt(limit) : 0;
    var self = this;

    // Posts.find({}, {
    //   limit: 10,
    //   sort: {
    //     createdAt: -1
    //   },
    //   fields: {
    //     userId: 1,
    //     title: 1,
    //     text: 1,
    //     createdAt: 1,
    //     likes: 1
    //   }
    // }).observeChanges({
    //   added: function(id, el) {
    //     el['xxx'] = 1;
    //     self.added('posts', id, el); 
    //   },
    //   changed: function(id, el) {
    //     el['xxx'] = 1;
    //   },
    //   removed: function(id, el) {
    //     el['xxx'] = 1;
    //   }
    // });

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

  // Meteor.publish('posts-by-user', function(userId) {
  //   var user = Meteor.users.find({
  //     _id: userId
  //   });
  //   if (!user) throw Meteor.Error('illegal-arguments');

  //   return Posts.find({
  //     userId: userId
  //   });
  // });

  Meteor.publish('comments', function(limit) {
    limit = parseInt(limit) ? parseInt(limit) : 0;

    return Comments.find({}, {
      // limit: limit,
      sort: {
        createdAt: 1
      }
    });
  });

  Meteor.publish('likes', function(limit) {
    limit = parseInt(limit) ? parseInt(limit) : 0;

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
    // TODO add limit
    return AnonymousUsers.find({
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
    limit = parseInt(limit) ? parseInt(limit) : 0;

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
    limit = parseInt(limit) ? parseInt(limit) : 0;

    return Notifications2.find({
      to: this.userId
    }, {
      // limit: limit
    });
  });

  // Meteor.publish('notifications2-new', function() {
  //   if (!this.userId) return null;

  //   return Notifications2.find({
  //     to: this.userId,
  //     seen: 0
  //   });
  // });


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