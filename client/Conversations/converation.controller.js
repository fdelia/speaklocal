(function() {
	'use strict';

	angular.module('app').controller('ConversationCtrl', ConversationCtrl);
	ConversationCtrl.$inject = ['$scope', '$meteor', '$stateParams', 'speakLocal'];

	function ConversationCtrl($scope, $meteor, $stateParams, speakLocal) {
		var vm = this;

		var convId = $stateParams.id;
		vm.timeAgo = speakLocal.timeAgo;
		vm.sendMessage = sendMessage;



		function sendMessage(text) {
			Meteor.call('sendMessage', convId, text, function(err, res) {
				$scope.$apply(); // not sure if necessary
			});
		}

		// reset notifications
		Meteor.call('seenConversation', convId, function(err, res) {

		});


		// TODO move to data service
		$meteor.subscribe('conversations').then(function() {
			$meteor.subscribe('messages').then(function() {

				$meteor.subscribe('anoUsers').then(function() {
					$meteor.subscribe('userAnoProfiles').then(function() {
						$meteor.subscribe('allUserData').then(function() {

							var conv = Conversations.findOne({
								_id: convId
							});

							if (!conv) {
								// display some error
								console.error('conversation not found');
								return;
							}

							var userIds = speakLocal.getAllUserIdsForThisUser($scope.currentUser._id);

							if (userIds.indexOf(conv.userId) !== -1) {
								conv.fromUserObj = speakLocal.getUser(conv.userId);
								conv.toUserObj = speakLocal.getUser(conv.toUser);
								// conv.unseenMsgs = conv.unseenMsgsFrom;
							}
							if (userIds.indexOf(conv.toUser) !== -1) {
								conv.fromUserObj = speakLocal.getUser(conv.toUser);
								conv.toUserObj = speakLocal.getUser(conv.userId);
								// conv.unseenMsgs = conv.unseenMsgsTo;
							}
							if (!conv.fromUserObj || !conv.toUserObj) {
								console.error('an user profile was not found');
								return;
							}


							vm.conv = conv;
							vm.msgs = Messages.find({
								convId: convId
							}, {
								sort: {
									'createdAt': 1
								}
							}).fetch();


						});
					});
				});
			});
		});

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