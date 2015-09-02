(function() {
	'use strict';

	angular.module('app').factory('UsersService', UsersService);
	UsersService.$inject = ['speakLocal', '$q'];

	function UsersService(speakLocal, $q) {
		var obj = {
			getUsers: getUsers,
			getUserByUsername: getUserByUsername,
			countLikesFromUser: countLikesFromUser,
			getActivities: getActivities,
			updateUserImage: updateUserImage,
			updateUser: updateUser
		};

		function getUsers() {
			return Meteor.users.find().fetch();

			// hm, done like this because kind of all service functions are promises
			// var def = $q.defer();

			// var users = Meteor.users.find().fetch();
			// def.resolve(users);

			// return def.promise;
		}

		function getUserByUsername(username) {
			return Meteor.users.findOne({
				username: username
			});
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

			// TODO add pagination here
			for (var i = 0; i < 20; i += 1) {
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

		function updateUser(userId, username, bio){
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