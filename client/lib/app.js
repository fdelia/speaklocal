// needs to be global
Posts = new Mongo.Collection('posts');
Posts2 = new Mongo.Collection('posts2');
Comments = new Mongo.Collection('comments');
Likes = new Mongo.Collection('likes');
Notifications = new Mongo.Collection('notifications'); // obsolete
Notifications2 = new Mongo.Collection('notifications2');
Messages = new Mongo.Collection('messages');
AnonymousUsers = new Mongo.Collection('anonymoususers');
Conversations = new Mongo.Collection('conversations');

// TODO
// var userImagesStore = new FS.Store.GridFS('userimages');
// UserImages = new FS.Collection('userimages', {stores: [userImagesStore]});

var userImagesStore = new FS.Store.GridFS('userimages' /*,{transformWrite: createThumb}*/);
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



Accounts.ui.config({
	passwordSignupFields: 'USERNAME_AND_EMAIL'
});


angular.module('app', ['angular-meteor', 'ui.router', 'ngSanitize', 'ui.bootstrap',
  'monospaced.elastic', 'ngFileUpload', 'ngImgCrop']);