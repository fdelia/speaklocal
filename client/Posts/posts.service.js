(function() {
	'use strict';

	angular.module('app').factory('PostsService', PostsService);
	PostsService.$inject = ['$q', 'speakLocal'];

	function PostsService($q, speakLocal) {
		var obj = {
			addComment: addComment,
			addPost: addPost,
			likeUnlikePost: likeUnlikePost,
			likeUnlikeComment: likeUnlikeComment,
			loadPosts: loadPosts
		};

		function addComment(postId, text) {
			var def = $q.defer();

			if (!postId)
				def.reject('No postId given');
			else if (!text)
				def.reject('Please add some text');
			else
				Meteor.call('addComment', postId, text, function(err, res) {
					if (err) def.reject(err);
					else def.resolve(res);
				});

			return def.promise;
		}

		function addPost(title, text) {
			var def = $q.defer();

			if (!title)
				def.reject('Please add a title');

			else if (!text)
				def.reject('Please add some text');

			else
				Meteor.call('addPost', title, text, function(err, res) {
					if (err) def.reject(err);
					else def.resolve(res);
				});

			return def.promise;
		}


		function likeUnlikePost(postId) {
			var def = $q.defer();

			Meteor.call('likeUnlikePostComment', 'post', postId, function(err, res) {
				if (err) def.reject(err);
				else def.resolve();
			});

			return def.promise;
		}

		function likeUnlikeComment(commentId) {
			var def = $q.defer();

			Meteor.call('likeUnlikePostComment', 'comment', commentId, function(err, res) {
				if (err) def.reject(err);
				else def.resolve();
			});

			return def.promise;
		}

		function loadPosts(){
			
		}

		return obj;

	}

})();