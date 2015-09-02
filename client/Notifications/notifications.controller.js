(function() {
	'use strict';

	angular.module('app').controller('NotiCtrl', NotiCtrl);
	NotiCtrl.$inject = ['$scope', 'speakLocal', '$state'];

	function NotiCtrl($scope, speakLocal, $state) {
		// subscription is needed to find posts/comments below
		$scope.timeAgo = speakLocal.timeAgo;
		$scope.loadMoreNotifs = loadMoreNotifs;
		$scope.markAllAsSeen = markAllAsSeen;

		$scope.loadNotifs = loadNotifs;
		$scope.removeNoti = removeNoti;

		var limit = 20;
		var loadPerPage = 20;
		
		var initialization = true;
		Notifications2.find().observeChanges({
			added: function(id, el) {
				if (!initialization)
					loadNotifs();
			}
		});
		initialization = false;


		function loadMoreNotifs() {
			limit += loadPerPage;
			$scope.loadNotifs();
		}

		function markAllAsSeen() {
			for (var i in $scope.notifications) {
				var noti = $scope.notifications[i];

				Meteor.call('removeNoti', noti.type, noti.on, function(err, res) {});
			}

			// todo: should wait to finish all the calls
			// is needed b/c notiController is not reactive (doesnt need to be)
			$state.go($state.current, {}, {
				reload: true
			});
		}

		function loadNotifs() {

			$scope.notifications = Notifications2.find({}, {
				sort: {
					// 'createdAt': -1
					'updatedAt': -1
				},
				limit: limit
			}).fetch();


			$scope.notifications.map(function(noti) {

				noti.fromUsers = _.uniq(noti.userIds.map(function(userId) {
					var user = speakLocal.getUser(userId);
					if (!user) { // precaution
						// delete notiGrouped[ind];
						console.error('Notification: user not found');
						return;
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
						return true; // continue
					}
				}

				if (noti._id == '5gn5RgqY9XSyZytcn')
					console.log($scope.notifications);

			});


		}
		$scope.loadNotifs();

		function removeNoti(type, onId) {
			Meteor.call('removeNoti', type, onId, function(err, res) {
				// $state.go to post
			});
		}
	}
	// ]);

})();