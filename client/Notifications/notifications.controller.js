(function() {
	'use strict';

	angular.module('app').controller('NotiCtrl', NotiCtrl);
	NotiCtrl.$inject = ['$scope', '$meteor', 'speakLocal', '$state'];

	function NotiCtrl($scope, $meteor, speakLocal, $state) {
		// subscription is needed to find posts/comments below
		$scope.timeAgo = speakLocal.timeAgo;
		$scope.loadMoreNotifs = loadMoreNotifs;
		$scope.markAllAsSeen = markAllAsSeen;

		$scope.loadNotifs = loadNotifs;
		$scope.removeNoti = removeNoti;

		var opts = {
			skip: 0,
			limit: 20,
			view: 'notifications'
		};

		var initialization = true;
		Notifications2.find().observeChanges({
			added: function(id, el){
				if (!initialization)
					loadNotifs();
			}
		});
		initialization = false;


		function loadMoreNotifs() {
			opts.skip = $scope.notiGrouped.length;
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
			$meteor.subscribe('notifications2').then(function() {
				$meteor.subscribe('posts').then(function() {
					$meteor.subscribe('comments').then(function() {

						$meteor.subscribe('allUserData').then(function() {
							$meteor.subscribe('anoUsers').then(function() {
								$meteor.subscribe('userAnoProfiles').then(function() {

									// console.log('subbed to posts: ' + Posts.find().fetch().length);
									// console.log('subbed to anoUsers: ' + AnonymousUsers.find().fetch().length);


									$scope.notifications = Notifications2.find({}, {
										sort: {
											// 'createdAt': -1
											'updatedAt': -1
										}
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


								});
							});
						});
					});
				});
			});
		}
		$scope.loadNotifs();

		function removeNoti(type, onId) {
			Meteor.call('removeNoti', type, onId, function(err, res) {
				// console.log(res);
			});
		}
	}
	// ]);

})();