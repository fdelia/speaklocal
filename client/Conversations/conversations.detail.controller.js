(function() {
	'use strict';

	angular.module('app').controller('ConversationsDetailCtrl', ConversationsDetailCtrl);
	ConversationsDetailCtrl.$inject = ['$scope', '$meteor', '$state', 'speakLocal', 'ConversationsService'];

	function ConversationsDetailCtrl($scope, $meteor, $state, speakLocal, ConversationsService) {
		var vm = this;

		var convId = $state.params.id;
		vm.timeAgo = speakLocal.timeAgo;
		vm.sendMessage = sendMessage;

		// reset notifications
		ConversationsService.setConvAsSeen(convId); // .then()

		// only subscribtion needed here
		$meteor.subscribe('messages').then(function() {

			vm.conv = ConversationsService.getConvWithAuthors($scope.currentUser._id, convId);
			vm.msgs = ConversationsService.listMessages(convId);

		});


		function sendMessage(text) {
			ConversationService.sendMessage(convId, text)
				.then(function(data) {
					// $scope.$apply(); // not sure if necessary
				}, function(err) {
					console.error('send message failed: ' + err);
				});
		}

		var initialization = true;
		Messages.find().observeChanges({
			added: function(id, msg) {
				// if new post (if this is the inserting user) we don't need to do that
				if (!initialization && vm.msgs) {
					msg._id = id;

					if (msg.convId === convId) {
						vm.msgs.push(msg);
						$scope.$apply();
					}
				}
			}
		});
		initialization = false;

	}

})();