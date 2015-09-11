(function() {
	'use strict';

	angular.module('app').factory('PostsService', PostsService);
	PostsService.$inject = ['$q', 'speakLocal', 'speakLocalData'];

	function PostsService($q, speakLocal, speakLocalData) {
		var service = {
			addComment: addComment,
			addPost: addPost,
			likeUnlikePost: likeUnlikePost,
			likeUnlikeComment: likeUnlikeComment,
			// loadPosts: loadPosts,
			loadPosts2: loadPosts2,
			getConversation: getConversation,
			updatePosts: updatePosts
		};
		return service;

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

		// if postId is undefined, load all posts (normal view)
		// function loadPosts(postId, opts) {
		// 	// default opts
		// 	opts = _.extend({
		// 		skip: 0,
		// 		limit: 0,
		// 		postId: postId
		// 	}, opts);


		// 	// show one post only or all
		// 	if (postId)
		// 		var posts = [Posts.findOne({
		// 			_id: postId
		// 		})];
		// 	else
		// 		var posts = Posts.find({}, {
		// 			sort: {
		// 				'createdAt': -1
		// 			},
		// 			skip: opts.skip,
		// 			limit: opts.limit,
		// 			fields: {
		// 				userId: 1,
		// 				title: 1,
		// 				text: 1,
		// 				createdAt: 1,
		// 				likes: 1
		// 			}
		// 		}).fetch();
		// 	// it's slow till here, seems from the query above, from 'sort'

		// 	return posts;
		// }

		// if postId is undefined, load all posts (normal view)
		function loadPosts2(postId, opts) {
			// default opts
			opts = _.extend({
				skip: 0,
				limit: 0,
				postId: postId
			}, opts);

			var def = $q.defer();

			speakLocalData.subscribePosts(opts)
				.then(function(res) {

					// show one post only or all
					if (postId)
						var posts = [Posts.findOne({
							_id: postId
						})];
					else
						var posts = Posts.find({}, {
							sort: {
								'createdAt': -1
							},
							skip: opts.skip,
							limit: opts.limit,
							fields: {
								userId: 1,
								title: 1,
								text: 1,
								createdAt: 1,
								likes: 1
							}
						}).fetch();
					// it's slow till here, seems from the query above, from 'sort'

					def.resolve(posts);
				});

			return def.promise;
		}

		function updatePosts(posts, likeObj, currentUser) {
			if (likeObj && likeObj.type === 'comment') var likedComment = Comments.findOne({
				_id: likeObj.on
			});

			for (var i = 0; i < posts.length; i += 1) {
				var post = posts[i];

				// for performance
				if (likeObj && likeObj.type === 'post' && post._id !== likeObj.on) continue;
				if (likedComment && likedComment.postId !== post._id) continue;

				post.user = speakLocal.getUser(post.userId, true);
				post.comments = Comments.find({
					postId: post._id
				}, {
					sort: {
						createdAt: 1
					},
					fields: {} // all fields
				}).fetch();

				for (var j = 0; j < post.comments.length; j += 1) {
					var comment = post.comments[j];

					if (likeObj && likeObj.type === 'comment' && post._id !== comment.postId) continue;
					comment.user = speakLocal.getUser(comment.userId, true);

					comment.likes = [];
					setCommentLikes(comment, currentUser);
				}

				setPostLikes(post, currentUser);

			}

			return posts;
		}

		function setCommentLikes(comment, currentUser) {
			var likes = Likes.find({
				on: comment._id,
				type: 'comment'
			}, {
				fields: {
					createdAt: 0
				}
			}).fetch();

			comment.userHasLiked = 0;
			comment.likes = likes.map(function(el) {
				// if (!el.userId) return; // unclear why this must be, maybe DB has strange inputs from dev

				// get the liking user
				var user = speakLocal.getUser(el.userId, true);
				if (!user) { // if user deleted etc.
					console.error('user not defined for comment like and userId ' + el.userId);
					return true;
				}

				if (user.isUser !== undefined || (currentUser && user.username === currentUser.username)) comment.userHasLiked = 1;
				return user.username;
			});
		}

		function setPostLikes(post, currentUser) {
			var likes = Likes.find({
				on: post._id,
				type: 'post'
			}, {
				fields: {
					createdAt: 0
				}
			}).fetch();

			post.userHasLiked = 0;
			post.likes = likes.map(function(el) {
				// if (!el.userId) return; // unclear why this must be, maybe DB has strange inputs from dev
				var user = speakLocal.getUser(el.userId, true);

				if (!user) { // if user deleted etc.
					console.error('user not defined for post like and userId ' + el.userId);
					return;
				}
				if (user.isUser !== undefined || (currentUser && user.username === currentUser.username)) post.userHasLiked = 1;
				return user.username;
			});
		}


		function getConversation(userId, postId) {
			var def = $q.defer();
			// getConv from server
			// returns convId
			// locate to this conv
			Meteor.call('getConversation', userId, postId, function(err, res) {
				if (err) def.reject(err);
				else def.resolve(res);
			});

			return def.promise;
		}

	}

})();