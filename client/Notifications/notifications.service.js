(function() {
	'use strict';

	angular.module('app').factory('NotificationsService', NotificationsService);
	NotificationsService.$inject = ['$q', 'speakLocal'];

	function NotificationsService($q, speakLocal) {
		var obj = {
			unmarkNotification: unmarkNotification,
			loadNotifications: loadNotifications
		};

		function unmarkNotification(type, on){
			var def = $q.defer();

			Meteor.call('removeNoti', type, on, function(err, res) {
				if (err) def.reject(err);
				else def.resolve(res);
			});

			return def.promise;
		}

		function loadNotifications(limit){
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

			return notifications;
		}



		return obj;

	}

})();