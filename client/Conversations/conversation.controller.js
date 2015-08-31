(function() {
	'use strict';

	angular.module('app').controller('ConversationCtrl', ConversationCtrl);
	ConversationCtrl.$inject = ['$scope', '$meteor', '$stateParams', 'speakLocal', 'ConversationService'];

	function ConversationCtrl($scope, $meteor, $stateParams, speakLocal, ConversationService) {
		var vm = this;

		var convId = $stateParams.id;
		vm.timeAgo = speakLocal.timeAgo;
		vm.sendMessage = sendMessage;

		// reset notifications
		ConversationService.setConvAsSeen(convId); // .then()

		// only subscribtion needed here
		$meteor.subscribe('messages').then(function() {

			vm.conv = ConversationService.getConvWithAuthors($scope.currentUser._id, convId);
			vm.msgs = ConversationService.listMessages(convId);

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