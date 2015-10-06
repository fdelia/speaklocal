/*
    In future: Split up the server files in modules like on client.
 */


const KITTEN_NAMES = 'Caliente,Salsa,Chili,Paprika,Tamale,Sunset,Frosty,Icy,Pearl,Snowball,Snowflake,Midnight,Ebony,Shadow,Indigo,Grimalkin,Kitty'.split(',');
// const KITTEN_NAMES = ['Cliente']; // dev

// TODO make data service to tidy up code
Meteor.methods({
  // anoMode
  anoModeGet: function() {
    if (!Meteor.user()) throw new Meteor.Error('not-allowed', 'Please log in');

    return Meteor.user().anoMode ? 1 : 0;
  },
  anoModeSet: function(anoMode) {
    if (!Meteor.user()) throw new Meteor.Error('not-allowed', 'Please log in');

    // validation
    if (anoMode) anoMode = 1;
    else anoMode = 0;

    Meteor.users.update({
      _id: Meteor.user()._id
    }, {
      $set: {
        anoMode: anoMode
      }
    });
    console.log('anoMode set to ' + anoMode);
    return anoMode;
  },

  // post
  addPost: function(title, text) {
    if (!Meteor.user()) throw new Meteor.Error('not-allowed', 'Please log in');
    if (!title || typeof title !== 'string') throw new Meteor.Error('illegal-arguments', 'Missing argument');
    if (!text || typeof text !== 'string') throw new Meteor.Error('illegal-arguments', 'Missing argument');

    // basic validation
    // TODO escapes also "
    title = _.escape(title).trim();
    text = _.escape(text).trim();

    // first make post, then the user thing, because postId is needed to create anonymous users
    var post = {
      title: title,
      text: text,
      createdAt: Date.now(),
      likes: [],
      spam: 0,
      comments: []
    };

    post._id = Posts.insert(post);
    var user = getThisUserOnPost(post._id);

    Posts.update({
      _id: post._id
    }, {
      $set: {
        userId: user._id
      }
    });

    console.log('inserted post');
    if (Meteor.user().anoMode) AnonymousUsers.update({
      _id: user._id
    }, {
      $set: {
        talkgOnPost: post._id
      }
    });

    return Posts.findOne({
      _id: post._id
    });
  },

  deletePost: function(postId) {
    if (!Meteor.user()) throw new Meteor.Error('not-allowed', 'Please log in');
    if (!postId) throw new Meteor.Error('illegal-arguments', 'Missing argument');

    // check if the post belongs to the current user
    var post = Posts.findOne({
      _id: postId,
      // userId: Meteor.user()._id
      userId: {
        $in: getAllUserIdsForThisUser()
      }
    });

    if (!post || post.length < 1) throw new Meteor.Error('not-allowed', 'No rights to delete post');


    // TODO
    // remove all dependencies (anoUsers, comments, likes, anoUsers of comments/likes)

    var res = Posts.remove({
      _id: postId
    });

    return res;
  },

  // comment
  addComment: function(postId, text) {
    if (!Meteor.user()) throw new Meteor.Error('not-allowed', 'Please log in');
    if (!postId) throw new Meteor.Error('illegal-arguments', 'Missing argument');
    if (!text || typeof text !== 'string') throw new Meteor.Error('illegal-arguments', 'Missing argument');


    var post = Posts.findOne({
      _id: postId
    });
    if (!post) throw new Meteor.Error('illegal-arguments', 'Wrong argument, post not found');

    // TODO validate text (remove html), but don't escape too much
    text = _.escape(text).trim();
    var user = getThisUserOnPost(postId);

    var comment = {
      postId: postId,
      userId: user._id,
      createdAt: Date.now(),
      text: text,
      likes: 0
    };

    comment._id = Comments.insert(comment);
    console.log('inserted comment');

    notifyUsersFromPost(postId, 'comment');

    return comment;
  },

  deleteComment: function(commentId) {
    if (!Meteor.user()) throw new Meteor.Error('not-allowed', 'Please log in');
    if (!commentId) throw new Meteor.Error('illegal-arguments', 'Missing argument');

    // check if comment belongs to user
    var comment = Comments.findOne({
      _id: commentId,
      userId: Meteor.user()._id
    });

    if (!comment || comment.length < 1) throw new Meteor.Error('not-allowed', 'No rights to delete post');

    // TODO
    // remove all dependencies (anoUsers, likes, anoUsers of likes)
    var res = Comments.remove({
      _id: commentId
    });

    return res;
  },


  // notification
  removeNoti: function(type, onId) {
    // console.log('remove ' + type + ' ' + onId);
    return Notifications2.update({
      type: type,
      to: Meteor.user()._id,
      on: onId,
      seen: 0
    }, {
      $set: {
        seen: 1
      }
    }, {
      multi: 1
    });
  },

  likeUnlikePostComment: function(type, id) {
    if (!Meteor.user()._id) throw new Meteor.Error('not-allowed', 'Please log in');
    if (!type) throw new Meteor.Error('illegal-arguments', 'Missing argument');
    if (!id) throw new Meteor.Error('illegal-arguments', 'Missing argument');

    // check if id is valid (from a post/comment)
    if (type === 'post') {
      var post = Posts.findOne({
        _id: id
      });
      if (post === undefined) return 'not allowed';
    } else if (type === 'comment') {
      var comment = Comments.findOne({
        _id: id
      });
      if (comment === undefined) return 'not allowed';
      var post = Posts.findOne({
        _id: comment.postId
      });
    } else throw new Meteor.Error('should-not-happen', 'Something went wrong...');

    console.log('like/unlike ' + type + ' : ' + id);

    /* 
      user can only like smth once
      the user has to decide if he/she wants to like anonymously or not
    */

    // search for normal user
    var user = Meteor.user();
    var existingLike = Likes.findOne({
      type: type,
      on: id,
      userId: user._id
    });
    // now search for anonymous user
    if (existingLike === undefined) {
      user = getAnoProfileForThisUser(post._id, null);

      existingLike = Likes.findOne({
        type: type,
        on: id,
        userId: user._id
      });
    }


    if (existingLike !== undefined) {
      Likes.remove({
        _id: existingLike._id
      });

      return 'removed';
    } else {
      user = getThisUserOnPost(post._id); // reset the overriden user

      var like = {
        userId: user._id,
        on: id,
        type: type,
        createdAt: Date.now()
      };

      like._id = Likes.insert(like);

      // notifications
      if (type === 'post')
        notifyUser(post.userId, post._id, 'likePost');
      if (type === 'comment')
        notifyUser(comment.userId, comment._id, 'likeComment');

      return like;
    }
  },

  // message
  sendMessage: function(convId, text) {
    if (!text) throw new Meteor.Error('illegal-arguments', 'Missing argument');
    if (!convId) throw new Meteor.Error('illegal-arguments', 'Missing argument');
    var conv = Conversations.findOne({
      _id: convId
    });
    if (!conv) throw new Meteor.Error('illegal-arguments', 'Conversation not found for given id');

    // find out which user is which
    // being first sender
    var thisUserIds = getAllUserIdsForThisUser();
    if (thisUserIds.indexOf(conv.userId) !== -1) {
      var fromUser = getAnyProfile(conv.userId);
      var toUser = getAnyProfile(conv.toUser);
      conv.unseenMsgsTo += 1;
    }
    // if responding in the conversation, attention: ids switched
    if (thisUserIds.indexOf(conv.toUser) !== -1) {
      var fromUser = getAnyProfile(conv.toUser);
      var toUser = getAnyProfile(conv.userId);
      conv.unseenMsgsFrom += 1;
    }
    if (!fromUser || !toUser) throw new Meteor.Error('illegal-arguments', 'User not found');

    var m = {
      convId: conv._id,
      userId: fromUser._id,
      toUser: toUser._id,
      text: text,
      createdAt: Date.now(),
      seen: 0
    };

    Messages.insert(m);
    console.log('sent message from: ' + fromUser.username + ', to: ' + toUser.username);

    Conversations.update({
      _id: convId
    }, {
      $set: {
        updatedAt: Date.now(),
        unseenMsgsFrom: conv.unseenMsgsFrom,
        unseenMsgsTo: conv.unseenMsgsTo,
        lastMsg: text
      }
    });

    // this is a trick, very unhappy to do it like this:
    // remove all empty conversations
    Conversations.remove({
      updatedAt: 0
    });

    return m;
  },

  getConversation: function(toUserId, postId) {
    // search for existing convs
    // if none found create one
    // postId is only used for anoProfile and if the conv is new

    if (!toUserId) throw new Meteor.Error('illegal-arguments', 'Missing argument');
    var toUser = getAnyProfile(toUserId);
    if (!toUser) throw new Meteor.Error('illegal-arguments', 'User not found for given id');

    var fromUser = getThisUserOnPost(postId);

    var conv = Conversations.findOne({
      $or: [{
        userId: fromUser._id,
        toUser: toUser._id
      }, {
        userId: toUser._id,
        toUser: fromUser._id
      }]
    });

    if (conv) return conv;

    // else create a conv
    // conceptual question: should empty conversations be possible? now they are
    var conv = {
      userId: fromUser._id,
      toUser: toUser._id,
      fromPostId: postId,
      createdAt: Date.now(),
      updatedAt: 0,
      unseenMsgsFrom: 0,
      unseenMsgsTo: 0,
      lastMsg: ''
    }

    var convId = Conversations.insert(conv);
    conv._id = convId;

    return conv;
  },

  seenConversation: function(convId) {
    if (!convId) throw new Meteor.Error('illegal-arguments', 'Missing argument');
    var conv = Conversations.findOne({
      _id: convId
    }); // add access selection?
    if (!conv) throw new Meteor.Error('illegal-arguments', 'Conversation not found for given id');

    console.log('seen conv ' + convId);

    var thisUserIds = getAllUserIdsForThisUser();
    if (thisUserIds.indexOf(conv.userId) !== -1) {
      conv.unseenMsgsFrom = 0;
    } else
    // if responding in the conversation, attention: ids switched
    if (thisUserIds.indexOf(conv.toUser) !== -1) {
      conv.unseenMsgsTo = 0;
    } else return false;

    return Conversations.update({
      _id: convId
    }, {
      $set: {
        unseenMsgsFrom: conv.unseenMsgsFrom,
        unseenMsgsTo: conv.unseenMsgsTo
      }
    });
  },

  updateProfile: function(userId, username, bio) {
    if (userId !== Meteor.user()._id) throw new Meteor.Error('illegal-arguments', 'Missing argument');
    if (username.trim().length < 3) throw new Meteor.Error('illegal-arguments', 'Missing argument');
    if (bio.trim().length < 3 || bio.length > 2000) throw new Meteor.Error('illegal-arguments', 'Missing argument');

    username = _.escape(username).trim();
    bio = _.escape(bio).trim();

    return Meteor.users.update({
      _id: userId
    }, {
      $set: {
        username: username,
        'profile.bio': bio // TODO test if this gets updated
      }
    });
  },

  updateUserImage: function(userImage) {
    if (!Meteor.user()) throw new Meteor.Error('not-allowed', 'not logged in');
    if (!userImage) throw new Meteor.Error('no-image', 'no user image received');

    var imageFile = new FS.File(userImage);
    imageFile.attachData(userImage);
    imageFile.createdAt = Date.now();
    imageFile.userId = Meteor.user()._id;

    // the filter doesnt work, so I'll do it here
    if (imageFile.original.type.indexOf('image/') === -1) throw new Meteor.Error('wrong-filetype', 'data received was not an image');
    if (imageFile.original.size > 500 * 1000) throw new Meteor.Error('file-too.big', 'the uploaded file is too big');


    var oldImg = UserImages.findOne({
      userId: Meteor.user()._id
    });

    if (oldImg) {
      // works somehow better than an update
      UserImages.remove({
        userId: Meteor.user()._id
      });
    }

    console.log('new user image saved');

    var obj = UserImages.insert(imageFile, function(err, res) {
      var a = Meteor.users.update({
        _id: Meteor.userId()
      }, {
        $set: {
          'profile.userImageUrl': '/cfs/files/userimages/' + res._id
        }
      });
    });

    return obj;
  },

  countLikesFromUser: function(userId) {
    // DRY, this is done several times
    var user = Meteor.users.findOne({
      _id: userId
    });
    if (!user) throw new Meteor.Error('illegal-arguments', 'Missing argument');

    // get all ids of posts and comments from this user
    var postIds = Posts.find({
      userId: user._id
    }).fetch().map(function(el) {
      return el._id;
    });
    var commIds = Comments.find({
      userId: user._id
    }).fetch().map(function(el) {
      return el._id;
    });
    var allIds = commIds.concat(postIds);

    var numberOfLikes = Likes.find({
      on: {
        $in: allIds
      }
    }).fetch().length;


    return numberOfLikes;
  }


});


/**
 * Server side getUser function, don't publish data to client
 */
function getThisUserOnPost(postId) {
  if (!postId) throw new Meteor.Error('illegal-arguments', 'Missing argument');

  var user;
  if (Meteor.user().anoMode) user = getAnoProfileForThisUser(postId, null);
  else user = Meteor.user();

  return user;
}

function getThisUserOnTalkgTo(userId) {
  if (!userId) throw new Meteor.Error('illegal-arguments', 'Missing argument');

  var user;
  if (Meteor.user().anoMode) user = getAnoProfileForThisUser(null, userId);
  else user = Meteor.user();

  return user;
}

function getRealUser(userId) {
  var anoUser = AnonymousUsers.findOne({
    _id: userId
  });
  if (anoUser) userId = anoUser.isUser;
  return Meteor.users.findOne({
    _id: userId
  });
}

function getAnyProfile(userId) {
  var user = AnonymousUsers.findOne({
    _id: userId
  });
  if (!user) user = Meteor.users.findOne({
    _id: userId
  });
  return user;
}

// returns anoUser for given postId *OR* given toUserId
function getAnoProfileForThisUser(postId, toUserId) {
  console.log('getAnoProfileForThisUser , ' + postId + ' , ' + toUserId);

  if (!postId && !toUserId) throw new Meteor.Error('illegal-arguments', 'Missing argument (need either postId or toUserId)');
  if (postId) {
    var anoUser = AnonymousUsers.findOne({
      talkgOnPost: postId,
      isUser: Meteor.user()._id
    });
    if (anoUser) return anoUser;
    else {
      // if new post, create anonymous profile
      var anoUser = createAnoUser(postId, null);
      // anoUser.talkgOnPost = postId;
      return anoUser;
    }
  }
  if (toUserId) {
    var anoUser = AnonymousUsers.findOne({
      talkgToUser: toUserId,
      isUser: Meteor.user()._id
    });
    if (anoUser) return anoUser;
    else {
      // if new conversation, create anonymous profile
      var anoUser = createAnoUser(null, toUserId);
      // anoUser.talkgToUser = toUserId;
      return anoUser;
    }
  }
}

function getAllUserIdsForThisUser() {
  var thisUserId = this.userId ? this.userId : Meteor.user()._id;
  var userIds = AnonymousUsers.find({
    isUser: thisUserId
  }).fetch().map(function(obj) {
    return obj._id;
  });

  userIds.push(thisUserId);
  return userIds;
}

function createAnoUser(postId, toUserId) {
  if (!postId && !toUserId) throw new Meteor.Error('illegal-arguments', 'Missing argument (need either postId oder toUserId)');
  console.log('createAnoUser: ', postId, toUserId);

  // random name: look at names given from postId
  // choose one of the set of left names
  var username;

  var usedNames = AnonymousUsers.find({
    talkgOnPost: postId
  }).fetch().map(function(obj) {
    return obj.username;
  });

  var leftNames = KITTEN_NAMES.filter(function(current) {
    return usedNames.filter(function(current_b) {
      return current_b == current;
    }).length === 0;
  });

  if (leftNames.length > 0)
    username = leftNames[Math.floor(Math.random() * leftNames.length)];
  else
    username = KITTEN_NAMES[Math.floor(Math.random() * KITTEN_NAMES.length)] + ' ' + Math.floor(Math.random() * 100000);
  console.log('new AnoProfile with username ' + username);

  var id = AnonymousUsers.insert({
    username: username,
    isUser: Meteor.user()._id,
    createdAt: Date.now(),
    talkgOnPost: postId,
    talkgToUser: toUserId,
    isAno: 1
  });

  return AnonymousUsers.findOne({
    _id: id
  }, {
    // isUser: 0
  });
}


function notifyUsersFromPost(postId, type) {
  var post = Posts.findOne({
    _id: postId
  });
  if (!post) return false;

  var comments = Comments.find({
    postId: postId
  }).fetch();
  if (!comments) return false;
  console.log('notifyUsersFromPost');

  var fromUser = getThisUserOnPost(postId);

  // in future: solve this with "subscriptions"
  userIds = _.groupBy(comments, function(comment) {
    var commUser = getRealUser(comment.userId);
    return commUser._id;
  });

  // for the author of the post
  notifyUser(post.userId, post._id, 'comment');

  for (var commUserId in userIds) {
    if (commUserId !== post.userId)
      notifyUser(commUserId, post._id, 'comment');
  }
}

function notifyUser(toUserId, elId, type) {
  console.log('notifyUser');

  // get postId
  var postId;
  if (type === 'likeComment') {
    var comment = Comments.findOne({
      _id: elId
    });
    postId = comment.postId;
  } else if (type === 'likePost' || type === 'comment') postId = elId;
  else return false; // shouldnt happen

  var fromUser = getThisUserOnPost(postId); // from liking user on this post
  var author = getRealUser(toUserId);
  // don't notify self
  if (Meteor.user()._id === author._id) return false;

  // if not already existing
  var existingNoti = Notifications2.findOne({
    userIds: fromUser._id, // matches if the _id is contained in userIds
    to: author._id,
    on: elId,
    type: type
  });


  if (existingNoti !== undefined) {
    if (existingNoti.seen === 0) return false;
    var newUserIds = existingNoti.userIds.slice(0);
    newUserIds.push(fromUser._id);

    return Notifications2.update({
      _id: existingNoti._id
    }, {
      $set: {
        seen: 0,
        updatedAt: Date.now(),
        // $push: { // doesnt work
        //   userIds: fromUser._id
        // }
        userIds: newUserIds
      }
    });
  }

  // new
  var noti = {
    userIds: [fromUser._id],
    to: author._id,
    on: elId,
    updatedAt: Date.now(),
    onPost: postId,
    type: type,
    seen: 0
  };

  return Notifications2.insert(noti);
}