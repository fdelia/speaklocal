(function() {
	'use strict';

	// this should be more than one service
	// (one for data handling, one for users and anoMode, one for helper functions)


	angular.module('app').factory('speakLocal', speakLocal);
	speakLocal.$inject = ['$meteor', '$q'];

	function speakLocal($meteor, $q) {
		var obj = {
			anoMode: false,
			getUser: getUser,
			getAllUserIdsForThisUser: getAllUserIdsForThisUser,
			getAnoMode: getAnoMode,
			switchAnoMode: switchAnoMode,
			timeAgo: timeAgo
		};


		// *** MUST BE SUBSCRIBED TO ANOUSERS AND ALLUSERDATA TO WORK ***
		function getUser(userId) {
			// if (userId === undefined) {
			// 	console.error('userId is undefined');
			// 	return null;
			// }
			if (!userId) {
				console.error('no userId given');
				return null;
			}

			var user = AnonymousUsers.findOne({
				_id: userId
			});

			if (user === undefined) {
				user = Meteor.users.findOne({
					_id: userId
				});
			}

			// user may still be undefined (if wrong userId)
			return user; 
		}

		function getAllUserIdsForThisUser(currentUserId) {
			var userIds = AnonymousUsers.find({
				isUser: currentUserId
			}).fetch().map(function(obj) {
				return obj._id;
			});

			userIds.push(currentUserId);
			return userIds;
		}

		function getAnoMode() {
			var def = $q.defer();
			Meteor.call('anoModeGet', function(err, res) {
				obj.anoMode = res ? true : false;
				def.resolve(obj.anoMode);
			});
			return def.promise;
			// return anoMode;
		}

		function switchAnoMode() {
			if (!obj.anoMode) obj.anoMode = true;
			else obj.anoMode = false;

			Meteor.call('anoModeSet', obj.anoMode, function(err, res) {});

			return obj.anoMode;
		}

		function timeAgo(date) {
			date = new Date(date);

			var seconds = Math.floor((new Date() - date) / 1000);
			var intervalType;

			var interval = Math.floor(seconds / 31536000);
			if (interval >= 1) {
				intervalType = 'year';
			} else {
				interval = Math.floor(seconds / 2592000);
				if (interval >= 1) {
					intervalType = 'month';
				} else {
					interval = Math.floor(seconds / 86400);
					if (interval >= 1) {
						intervalType = 'day';
					} else {
						interval = Math.floor(seconds / 3600);
						if (interval >= 1) {
							intervalType = "hour";
						} else {
							interval = Math.floor(seconds / 60);
							if (interval >= 1) {
								intervalType = "minute";
							} else {
								interval = seconds;
								intervalType = "second";
							}
						}
					}
				}
			}

			if (interval > 1 || interval === 0) {
				intervalType += 's';
			}

			return interval + ' ' + intervalType;
		}


		return obj;

	}

})();