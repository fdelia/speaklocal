(function() {
	'use strict';

	angular.module('app').factory('ConversationsService', ConversationsService);
	ConversationsService.$inject = ['$q', 'speakLocal'];

	function ConversationsService($q, speakLocal) {
		var obj = {
			setConvAsSeen: setConvAsSeen,
			sendMessage: sendMessage,
			listMessages: listMessages,
			getConvWithAuthors: getConvWithAuthors,
			listConvs: listConvs
		};

		function setConvAsSeen(convId) {
			var def = $q.defer();
			Meteor.call('seenConversation', convId, function(err, res) {
				if (err)
					def.reject(err);
				else
					def.resolve(res);
			});
			return def.promise;
		}

		function sendMessage(convId, text) {
			var def = $q.defer();
			Meteor.call('sendMessage', convId, text, function(err, res) {
				if (err)
					def.reject(err);
				else
					def.resolve(res);
			});
			return def.promise;
		}

		function listMessages(convId) {
			return Messages.find({
				convId: convId
			}, {
				sort: {
					'createdAt': 1
				},
				fields: {
					convId: 0
				}
			}).fetch();

		}

		function getConvWithAuthors(currentUserId, convId){
			var conv = Conversations.findOne({
				_id: convId
			});

			if (!conv) {
				// display some error
				console.error('conversation not found');
				return null;
			}

			var userIds = speakLocal.getAllUserIdsForThisUser(currentUserId);

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
			}

			return conv;
		}

		function listConvs(currentUserId, limit) {
			var convs = Conversations.find({}, {
				sort: {
					'updatedAt': -1
				},
				limit: limit
			}).fetch();

			var userIds = speakLocal.getAllUserIdsForThisUser(currentUserId);

			convs.map(function(conv) {

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

			return convs;
		}

		return obj;

	}

})();