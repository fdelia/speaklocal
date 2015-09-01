(function() {
	'use strict';

	angular.module('app').controller('ConversationsCtrl', ConversationsCtrl);
	ConversationsCtrl.$inject = ['$scope', 'speakLocal', 'ConversationsService'];

	function ConversationsCtrl($scope, speakLocal, ConversationsService) {
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

		function loadConversationList(){
			$scope.convs = ConversationsService.listConvs($scope.currentUser._id, limit);
		}

	}

})();