(function() {
	'use strict';

	angular.module('app').factory('NotificationsService', NotificationsService);
	NotificationsService.$inject = ['$q', 'speakLocal', 'speakLocalData'];

	function NotificationsService($q, speakLocal, speakLocalData) {
		var service = {
			unmarkNotification: unmarkNotification,
			// loadNotifications: loadNotifications,
			loadNotifications2: loadNotifications2
		};

		return service;



		function unmarkNotification(type, on) {
			var def = $q.defer();

			Meteor.call('removeNoti', type, on, function(err, res) {
				if (err) def.reject(err);
				else def.resolve(res);
			});

			return def.promise;
		}

		// function loadNotifications(limit) {
		// 	var notifications = Notifications2.find({}, {
		// 		sort: {
		// 			'updatedAt': -1
		// 		},
		// 		limit: limit
		// 	}).fetch();


		// 	notifications.forEach(function(noti) {

		// 		noti.fromUsers = _.uniq(noti.userIds.map(function(userId) {
		// 			var user = speakLocal.getUser(userId);
		// 			if (!user) { // precaution, if user deleted
		// 				console.error('Notification: user not found');
		// 				return; // continue
		// 			}
		// 			return user.username;
		// 		}));

		// 		noti.post = Posts.findOne({
		// 			_id: noti.onPost
		// 		});

		// 		if (noti.type === 'likeComment') {
		// 			noti.comment = Comments.findOne({
		// 				_id: noti.on
		// 			});
		// 			if (!noti.comment) {
		// 				console.error('comment not received. not published?');
		// 				return; // continue
		// 			}
		// 		}

		// 	});

		// 	return notifications;
		// }

		function loadNotifications2(limit) {
			var opts = {
				skip: 0,
				limit: limit
			}
			var def = $q.defer();

			speakLocalData.subscribeNotifications(opts)
				.then(function(res) {

					var notifications = Notifications2.find({}, {
						sort: {
							'updatedAt': -1
						},
						limit: limit
					}).fetch();


					notifications.forEach(function(noti) {

						noti.fromUsers = _.uniq(noti.userIds.map(function(userId) {
							var user = speakLocal.getUser(userId);
							if (!user) { // precaution, if user deleted
								console.error('Notification: user not found');
								return; // continue
							}
							return user.username;
						}));

						noti.post = Posts.findOne({
							_id: noti.onPost
						});

						if (noti.type === 'likeComment') {
							noti.comment = Comments.findOne({
								_id: noti.on
							});
							if (!noti.comment) {
								console.error('comment not received. not published?');
								return; // continue
							}
						}

					});

					def.resolve(notifications);
				});

			return def.promise;
		}

	}

})();