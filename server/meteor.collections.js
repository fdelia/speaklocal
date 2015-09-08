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



  // NEW WITH HACK bc. of performance issues


  // for posts-view aka. stream
  // include comments, likes and anoUsers
  // function embedIntoPostsByLimit(id, post) {
  //   post.comments = Comments.find({
  //     postId: id
  //   }, {
  //     sort: {
  //       createdAt: 1
  //     }
  //   });

  //   // TODO embed likes and anoUsers
    
  //   return post;
  // }
  // Meteor.publish('posts-by-limit', function(limit) {
  //   var self = this;
  //   limit = parseInt(limit) ? parseInt(limit) : 0;

  //   var cursor = Posts.find({}, {
  //     limit: limit,
  //     sort: {
  //       createdAt: -1
  //     },
  //     fields: {
  //       userId: 1,
  //       title: 1,
  //       text: 1,
  //       createdAt: 1,
  //       likes: 1
  //     }
  //   });

  //   cursor.observeChanges({
  //     added: function(id, el) {
  //       self.added('posts-by-limit', id, embedIntoPostsByLimit(id, el));
  //     },
  //     changed: function(id, el) {
  //       self.changed('posts-by-limit', id, embedIntoPostsByLimit(id, el));
  //     },
  //     removed: function(id, el) {
  //       self.removed('posts-by-limit', id, embedIntoPostsByLimit(id, el));
  //     }
  //   });

  //   return cursor;
  // });

  // // for activity-view
  // Meteor.publish('posts-by-user', function(userId) {});

  // // for activity-view
  // Meteor.publish('comments-by-user', function(userId) {

  // });

  // // for activity-view
  // Meteor.publish('likes-by-user', function(userId) {

  // });

  // // for notifications-view
  // // embed anoUsers
  // Meteor.publish('notifications-by-limit', function(limit) {

  // });

  // // for conversations-view
  // // embed anoUsers
  // Meteor.publish('conversations-by-limit', function(limit) {

  // });

  // // for conversation-view
  // // embed messages and anoUsers
  // Meteor.publish('conversation-by-id', function(convId) {

  // });



})();