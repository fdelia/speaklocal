(function() {
	'use strict';

	angular.module('app').factory('ConversationsService', ConversationsService);
	ConversationsService.$inject = ['$q', 'speakLocal', 'speakLocalData'];

	function ConversationsService($q, speakLocal, speakLocalData) {
		var service = {
			setConvAsSeen: setConvAsSeen,
			sendMessage: sendMessage,
			listMessages: listMessages,
			getConvWithAuthors2: getConvWithAuthors2,
			listConvs2: listConvs2
		};

		return service;


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
				},
				reactive: false
			}).fetch();

		}

		function getConvWithAuthors2(currentUserId, convId) {
			if (!convId && typeof convId === 'string') {
				console.error('convId is not given or not a string');
				return false;
			}

			var def = $q.defer();
			
			speakLocalData.subscribeConvWithAuthors(convId)
				.then(function() {
					var conv = Conversations.findOne({
						_id: convId
					}, {
						reactive: false
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

					def.resolve(conv);
				});

			return def.promise;
		}

		function listConvs2(currentUserId, limit) {
			var def = $q.defer();

			var opts = {
				limit: limit
			};

			speakLocalData.subscribeConversations(opts)
				.then(function() {
					var convs = Conversations.find({}, {
						sort: {
							'updatedAt': -1
						},
						reactive: false,
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
							console.error('an user profile was not found, id (fromUser): ' + conv.userId);
							return true; // continue
						}
						if (!conv.toUserObj) {
							console.error('an user profile was not found, id (toUser): ' + conv.toUser);
							return true; // continue
						}

					});

					def.resolve(convs);
				});

			return def.promise;
		}
	}

})();