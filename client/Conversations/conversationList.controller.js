(function() {
	'use strict';

	angular.module('app').controller('ConversationsCtrl', ConversationsCtrl);
	ConversationsCtrl.$inject = ['$scope', 'speakLocal'];

	function ConversationsCtrl($scope, speakLocal) {
		$scope.timeAgo = speakLocal.timeAgo;
		$scope.loadMoreConvs = loadMoreConvs;
		
		var limit = 20;
		var loadPerPage = 20;

		loadConversationList();

		var initialization = true;
		Conversations.find().observeChanges({
			added: function(id, el) {
				if (!initialization)
					loadConversationList();
			},
			changed: function(id, el) {
				if (!initialization)
					loadConversationList();
			}
		});
		initialization = false;

		function loadMoreConvs(){
			limit += loadPerPage;
			loadConversationList();
		}

		// TODO move to data service
		function loadConversationList() {
			
			// order by updatedAt reverse (newest comes first)
			$scope.convs = Conversations.find({}, {
				sort: {
					'updatedAt': -1
				},
				limit: limit
			}).fetch();

			var userIds = speakLocal.getAllUserIdsForThisUser($scope.currentUser._id);

			$scope.convs.map(function(conv) {

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
					return true; // continue
				}
				if (!conv.toUserObj) {
					console.error('an user profile was not found, id: ' + conv.toUser);
					return true; // continue
				}

			});
		}
	}
	// ]);

})();