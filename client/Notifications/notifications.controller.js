(function() {
	'use strict';

	angular.module('app').controller('NotiCtrl', NotiCtrl);
	NotiCtrl.$inject = ['$scope', 'speakLocal', '$state', 'NotificationsService'];

	function NotiCtrl($scope, speakLocal, $state, NotificationsService) {
		// subscription is needed to find posts/comments below
		$scope.timeAgo = speakLocal.timeAgo;
		$scope.loadMoreNotifs = loadMoreNotifs;

		$scope.markAllAsSeen = markAllAsSeen;
		$scope.removeNoti = removeNoti;

		var limit = 20;
		var loadPerPage = 20;
		
		loadNotifs();

		var initialization = true;
		Notifications2.find().observeChanges({
			added: function(id, el) {
				if (!initialization)
					loadNotifs();
			},
			changed: function(id, el){
				if (!initialization)
					loadNotifs();	
			}
		});
		initialization = false;


		function loadMoreNotifs() {
			limit += loadPerPage;
			loadNotifs();
		}

		function markAllAsSeen() {
			for (var i=0; i<$scope.notifications.length; i+=1) {
				var noti = $scope.notifications[i];
				if (noti.seen === 0)
					removeNoti(noti.type, noti.on);
			}

			// TODO addAlert success
		}

		function removeNoti(type, onId) {
			NotificationsService.unmarkNotification(type, onId);
					//.then(function(data){}, function(err){});
		}

		function loadNotifs() {
			$scope.notifications = NotificationsService.loadNotifications(limit);
		}

	}

})();