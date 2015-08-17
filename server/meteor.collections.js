/*
    In future: Split up the server files in modules like on client.
 */

Posts = new Mongo.Collection('posts');
// Posts2 = new Mongo.Collection('posts2');
Comments = new Mongo.Collection('comments');
Likes = new Mongo.Collection('likes');
Notifications2 = new Mongo.Collection('notifications2');
Messages = new Mongo.Collection('messages');
AnonymousUsers = new Mongo.Collection('anonymoususers'); // isUser-field is connection to normal users
Conversations = new Mongo.Collection('conversations');



// var createThumb = function(fileObj, readStream, writeStream) {
//   // Transform the image into a thumbnail
//   gm(readStream, fileObj.name()).resize('50', '50').stream().pipe(writeStream);
// };


var userImagesStore = new FS.Store.GridFS('userimages' /*,{transformWrite: createThumb}*/ );
UserImages = new FS.Collection('userimages', {
  stores: [userImagesStore],
  filter: {
    maxSize: 500 * 1000 * 1000, // 500kb
    allow: {
      contentTypes: ['image/*'],
      extensions: ['png', 'jpg', 'jpeg']
    },
    onInvalid: function(msg) {
      // doesnt work
      // there is nothing logged if filter doesnt match, 
      // and the old image is deleted / new one not inserted
      console.log('Error FSCollection insert: ' + msg);
    }
  }
});


// UserImages.remove({});



Meteor.startup(function() {
  // add indexes for performance
  // we are always doing queries over the same fields
  Comments._ensureIndex({
    postId: 1
  });
  Likes._ensureIndex({
    on: 1
  });
  Notifications2._ensureIndex({
    userId: 1
  });
  AnonymousUsers._ensureIndex({
    talkgOnPost: 1,
    isUser: 1
  });
  Conversations._ensureIndex({
    userId: 1,
    toUser: 1
  });
  Messages._ensureIndex({
    convId: 1
  });

});



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
UserImages.allow({
  download: function() {
    return true;
  }
});


/*
 *  From here the solution is very unsatisfying:
 *  I tried to put the whole logic which computes what data is needed on the server.
 *  Sure, it's the high-performance method, but it's not readable and error-prone.
 *  I think the better way would be to use publish/subscribe as simple API and put the
 *  data logic on the client side.
 */

var SLCollection = {
  postsCursor: null,
  commentsCursor: null,
  likesCursor: null,
  anoUsersCursor: null,
  userAnoProfilesCursor: null,
  notifsCursor: null,
  conversationsCursor: null,
  opts: null,
  view: null,
  userId: null,
  postId: null,
  postsForStream: function(opts, userId) {
    if (!opts) opts = {};
    if (!opts.skip) opts.skip = 0;
    if (!opts.limit) opts.limit = 30;

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
  },
  postsById: function(postId, userId) {
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
  },
  byUserActivity: function(opts, userId) {
    if (this.view === 'userActivity' && this.opts && userId && this.opts.userId === opts.userId && this.opts.limit === opts.limit && this.opts.skip === opts.skip && this.userId === userId) {
      console.log('already set: byUserActivity');
      return;
    }

    this.opts = opts;
    this.userId = userId;
    this.view = 'userActivity';

    // TODO
  },
  forNotifications: function(opts, userId) {
    // TODO if

    this.opts = opts;
    this.userId = userId;
    this.view = 'notifs';

    // TODO
  },
  forConversations: function(opts, userId) {
    if (this.view === 'conversations' && this.userId === userId &&
      this.opts.skip === opts.skip && this.opts.limit === opts.limit) {
      console.log('already set: forConversations');
      return;
    }
    if (!opts.skip) opts.skip = 0;
    if (!opts.limit) opts.limit = 20;

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
  },
  publishEverything: function(userId) {
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
  },

  setCursors: function(opts, userId) {
    // if (this.userId === userId && this.view === opts.view){
    //   console.log('already set');
    //   return;
    // }

    if (opts && opts.postId) {
      SLCollection.postsById(opts.postId, userId);
    } else if (opts && opts.userId) {
      SLCollection.byUserActivity(opts, userId);
    } else if (opts && opts.view === 'notifications') {
      SLCollection.forNotifications(opts, userId);
    } else if (opts && opts.limit !== undefined && opts.skip !== undefined) {
      SLCollection.postsForStream(opts, userId);
    } else {
      SLCollection.publishEverything(userId);
    }
  }
};


// no user identification needed for these

// i'm really unsure if this is a good solution, it's pretty messy
Meteor.publish('posts', function(opts) {
  // console.log('posts');
  SLCollection.setCursors(opts, this.userId);
  return SLCollection.postsCursor;
  // return Posts.find();
});

Meteor.publish('comments', function(opts) {
  // console.log('comments');
  SLCollection.setCursors(opts, this.userId);
  return SLCollection.commentsCursor;
  // return Comments.find();
});

Meteor.publish('likes', function(opts) {
  // console.log('likes');
  SLCollection.setCursors(opts, this.userId);
  return SLCollection.likesCursor;
  // return Likes.find();
});

Meteor.publish('anoUsers', function(opts) {
  // return AnonymousUsers.find({}, {
  //   fields: {
  //     isUser: 0,
  //     createdAt: 0
  //   }
  // });
  // console.log('anoUsers');
  SLCollection.setCursors(opts, this.userId);
  return SLCollection.anoUsersCursor;
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
  // console.log('userAnoProfiles');
  SLCollection.setCursors(opts, this.userId);
  return SLCollection.userAnoProfilesCursor;
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