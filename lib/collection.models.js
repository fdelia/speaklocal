// this file needs to have global scope

// don't use 'var ' for collections, not sure why
Posts = new Mongo.Collection('posts');
Posts2 = new Mongo.Collection('posts2');
Comments = new Mongo.Collection('comments');
Likes = new Mongo.Collection('likes');
// Notifications = new Mongo.Collection('notifications'); // obsolete
Notifications2 = new Mongo.Collection('notifications2');
Messages = new Mongo.Collection('messages');
AnonymousUsers = new Mongo.Collection('anonymoususers');
Conversations = new Mongo.Collection('conversations');

// TODO
// var userImagesStore = new FS.Store.GridFS('userimages');
// UserImages = new FS.Collection('userimages', {stores: [userImagesStore]});

var userImagesStore = new FS.Store.GridFS('userimages' /*,{transformWrite: createThumb}*/ );
// var userImagesStore = new FS.Store.Filesystem('userimages', {
//   path: 'public/userimages'
// });
UserImages = new FS.Collection('userimages', {
  stores: [userImagesStore],
  filter: {
    maxSize: 1000 * 1000 * 1000, // 1mb
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



Meteor.startup(function() {




  if (Meteor.isServer) {

    UserImages.allow({
      download: function() {
        return true;
      }
    });

    // add indexes for performance
    // indexes for most used fields
    
    Posts._ensureIndex({
      createdAt: 1
    });
    Comments._ensureIndex({
      postId: 1,
      createdAt: 1
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
  }

});
