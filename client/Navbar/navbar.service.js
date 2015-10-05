(function() {
	'use strict';

	angular.module('app').factory('NavbarService', NavbarService);
	NavbarService.$inject = ['$q', 'speakLocal'];

	function NavbarService($q, speakLocal) {
		var obj = {
			returnNotiCounter: returnNotiCounter,
			returnNewConvCounter: returnNewConvCounter,
			getAnoMode: getAnoMode,
			switchAnoMode: switchAnoMode
		};

		// var anoMode = false;

		function returnNotiCounter() {
			return Notifications2.find({
				// to: this.userId, // is already done on server
				seen: 0
			}, {
				fields: {
					seen: 1
				},
				reactive: false
			}).fetch().length;
		}

		function returnNewConvCounter(currentUserId) {
			var msgCounter = 0;
			var userIds = speakLocal.getAllUserIdsForThisUser(currentUserId);

			var convs = Conversations.find({
				$or: [{
					userId: {
						$in: userIds
					},
					unseenMsgsFrom: {
						$gt: 0
					}
				}, {
					toUser: {
						$in: userIds
					},
					unseenMsgsTo: {
						$gt: 0
					}
				}]
			}, {
				fields: {
					unseenMsgsTo: 1,
					unseenMsgsFrom: 1,
					toUser: 1,
					userId: 1
				},
				reactive: false
			}).fetch();

			convs.forEach(function(conv) {
				if (userIds.indexOf(conv.userId) !== -1)
					msgCounter += conv.unseenMsgsFrom ? 1 : 0;

				if (userIds.indexOf(conv.toUser) !== -1)
					msgCounter += conv.unseenMsgsTo ? 1 : 0;

			});

			return msgCounter;
		}

		function getAnoMode() {
			var def = $q.defer();

			speakLocal.getAnoMode()
				.then(function(data) {
					def.resolve(data);
				}, function(err) {
					def.reject(err);
				});

			return def.promise;
		}

		function switchAnoMode() {
			return speakLocal.switchAnoMode();
		}

		return obj;

	}

})();