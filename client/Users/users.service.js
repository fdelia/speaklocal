(function() {
	'use strict';

	angular.module('app').factory('UsersService', UsersService);
	UsersService.$inject = ['$q', 'speakLocal', 'speakLocalData'];

	function UsersService($q, speakLocal, speakLocalData) {
		var obj = {
			getUsers: getUsers,
			getUserByUsername: getUserByUsername,
			countLikesFromUser: countLikesFromUser,
			getActivities: getActivities,
			updateUserImage: updateUserImage,
			updateUser: updateUser
		};

		function getUsers() {
			// TODO integrate skip & limit
			var opts = {
				skip: 0,
				limit: 0
			}

			var def = $q.defer();
			speakLocalData.subscribeUserList(opts)
				.then(function() {
					var users = Meteor.users.find({}, {
						sort: {
							'username': 1
						}
					}).fetch();
					def.resolve(users);
				});
			return def.promise;
		}

		function getUserByUsername(username) {
			var def = $q.defer();
			speakLocalData.subscribeUserByUsername(username)
				.then(function() {
					var user = Meteor.users.findOne({
						username: username
					});
					def.resolve(user);
				});
			return def.promise;
		}

		function countLikesFromUser(userId) {
			var def = $q.defer();

			Meteor.call('countLikesFromUser', userId, function(err, res) {
				if (err) def.reject(err);
				else def.resolve(res);
			});

			return def.promise;
		}

		function getActivities(userId) {

			var opts = {
				userId: userId
			};
			var activityLog = {}; // key = createdAt, obj = activity
			var activityList = []; // result array, will be returned


			// get all "activity elements"
			var allElements = Posts.find({
				userId: userId
			}).fetch();
			allElements = allElements.concat(Comments.find({
				userId: userId
			}).fetch());
			allElements = allElements.concat(Likes.find({
				userId: userId
			}).fetch());

			for (var i = 0; i < allElements.length; i += 1) {
				var el = allElements[i];
				if (!el.createdAt) continue; // shouldn't happen
				activityLog[el.createdAt] = el;
			}

			// sort by date
			function compareNumbers(a, b) {
				return b - a;
			}
			var sortedKeys = Object.keys(activityLog);
			sortedKeys.sort(compareNumbers);
			var maxLength = Math.min(sortedKeys.length, 20);

			// TODO add pagination here
			for (var i = 0; i < maxLength; i += 1) {
				var key = sortedKeys[i];
				// if (!key) break;

				// add aditional data

				// only for likes (only likes have .on)
				if (activityLog[key].on) {

					if (activityLog[key].type === 'post') {
						activityLog[key].post = Posts.findOne({
							_id: activityLog[key].on
						});
					}

					if (activityLog[key].type === 'comment') {
						activityLog[key].comment = Comments.findOne({
							_id: activityLog[key].on
						});
						if (!activityLog[key].comment || !activityLog[key].comment.postId) return;
						activityLog[key].post = Posts.findOne({
							_id: activityLog[key].comment.postId
						});
					}
				}

				activityList.push(activityLog[key]);
			}


			return activityList;
		}


		function updateUserImage(croppedImg) {
			var def = $q.defer();
			Meteor.call('updateUserImage', croppedImg, function(err, res) {
				if (err)
					def.reject(err);
				else
					def.resolve(res);

			});

			return def.promise;
		}

		function updateUser(userId, username, bio) {
			var def = $q.defer();

			// TODO bio is not being set -> profile.bio
			Meteor.call('updateProfile', userId, username, bio, function(err, res) {
				if (err)
					def.reject(err);
				else
					def.resolve(res);
			});

			return def.promise;
		}


		return obj;

	}

})();