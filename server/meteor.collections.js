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

  Meteor.publish('posts', function(opts) {
    return Posts.find();
  });

  Meteor.publish('comments', function(opts) {
    return Comments.find();
  });

  Meteor.publish('likes', function(opts) {
    return Likes.find();
  });

  Meteor.publish('anoUsers', function(opts) {
    return AnonymousUsers.find({}, {
      fields: {
        isUser: 0,
        createdAt: 0
      }
    });
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
    return AnonymousUsers.find({
      isUser: this.userId
    }, {
      fields: {
        createdAt: 0 // not necessary
      }
    });
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