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

		function loadMoreConvs() {
			limit += loadPerPage;
			loadConversationList();
		}

		function loadConversationList() {
			// load one more to see if there are more
			var convs = ConversationsService.listConvs($scope.currentUser._id, limit + 1);
			if (convs.length > limit) {
				// only remove one if there is one too much
				convs = convs.slice(0, limit);
				$scope.showLoadMoreButton = true;
			} else $scope.showLoadMoreButton = false;

			$scope.convs = convs;
		}

	}

})();