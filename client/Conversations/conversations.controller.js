(function() {
	'use strict';

	angular.module('app').controller('ConversationsCtrl', ConversationsCtrl);
	ConversationsCtrl.$inject = ['$scope', 'speakLocal', 'ConversationsService'];

	function ConversationsCtrl($scope, speakLocal, ConversationsService) {
		$scope.timeAgo = speakLocal.timeAgo;
		$scope.loadMoreConvs = loadMoreConvs;
		$scope.showLoadMoreButton = true;

		var limit = 20;
		var loadPerPage = 20;

		loadConversationList();

		var loadingConversations = true;
		Conversations.find().observeChanges({
			added: function(id, el) {
				if (!loadingConversations)
					loadConversationList();
			},
			changed: function(id, el) {
				if (!loadingConversations)
					loadConversationList();
			}
		});

		function loadMoreConvs() {
			limit += loadPerPage;
			loadConversationList();
		}

		function loadConversationList() {
			// load one more to see if there are more
			ConversationsService.listConvs2($scope.currentUser._id, limit + 1)
				.then(function(data) {
					var convs = data;
					// var convs = ConversationsService.listConvs($scope.currentUser._id, limit + 1);
					if (convs.length > limit) {
						// only remove one if there is one too much
						convs = convs.slice(0, limit);
						$scope.showLoadMoreButton = true;
					} else $scope.showLoadMoreButton = false;

					$scope.convs = convs;
					loadingConversations = false; // mark end of loading
				});
		}

	}

})();