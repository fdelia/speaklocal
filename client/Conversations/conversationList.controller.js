(function() {
	'use strict';

	angular.module('app').controller('ConversationsCtrl', ConversationsCtrl);
	ConversationsCtrl.$inject = ['$scope', '$meteor', 'speakLocal'];

	function ConversationsCtrl($scope, $meteor, speakLocal) {
		$scope.timeAgo = speakLocal.timeAgo;
		$scope.quantity = 20;

		var opts = {};

		$meteor.subscribe('conversations').then(function() {

			$meteor.subscribe('allUserData').then(function() {
				$meteor.subscribe('anoUsers', opts).then(function() {
					$meteor.subscribe('userAnoProfiles', opts).then(function() {

						// console.log('subbed to posts: ' + Posts.find().fetch().length);
						// console.log('subbed to anoUsers: ' + AnonymousUsers.find().fetch().length);
						// console.log('subbed to anoUsers: ' + AnonymousUsers.find().fetch().length);
						// console.log('subbed to users: ' + Meteor.users.find().fetch().length);


						// order by updatedAt reverse (newest comes first)
						$scope.convs = Conversations.find({}, {
							sort: {
								'updatedAt': -1
							}
						}).fetch();

						var userIds = speakLocal.getAllUserIdsForThisUser($scope.currentUser._id);

						for (var i in $scope.convs) {
							var conv = $scope.convs[i];

							if (userIds.indexOf(conv.userId) !== -1) {
								conv.fromUserObj = speakLocal.getUser(conv.userId);
								conv.toUserObj = speakLocal.getUser(conv.toUser);
								conv.unseenMsgs = conv.unseenMsgsFrom;
							}
							if (userIds.indexOf(conv.toUser) !== -1) {
								conv.fromUserObj = speakLocal.getUser(conv.toUser);
								conv.toUserObj = speakLocal.getUser(conv.userId);
								conv.unseenMsgs = conv.unseenMsgsTo;
							}
							if (!conv.fromUserObj) {
								console.error('an user profile was not found, id: ' + conv.userId);
								continue;
							}
							if (!conv.toUserObj) {
								console.error('an user profile was not found, id: ' + conv.toUser);
								continue;
							}
						}
					});
				});
			});
		});
	}
	// ]);

})();