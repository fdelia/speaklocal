(function() {
	'use strict';


	angular.module('app').factory('speakLocalData', speakLocalData);
	speakLocalData.$inject = ['$meteor', '$q'];

	function speakLocalData($meteor, $q) {
		var obj = {
			subscribeAll: subscribeAll
		};

		var subscribed = false;

		function subscribeAll() {
			var def = $q.defer();

			// Meteor docs say that there won't be a resubscribtion
			// But it's a bit faster when a second subscribtion is not even tried

			// Skip second subscribtion
			if (subscribed) {
				def.resolve('already subscribed');
				return def.promise;
			}

			var opts = {};
			$meteor.subscribe('posts', opts).then(function() {
				$meteor.subscribe('comments', opts).then(function() {
					$meteor.subscribe('likes', opts).then(function() {

						$meteor.subscribe('allUserData').then(function() {
							$meteor.subscribe('anoUsers', opts).then(function() {
								$meteor.subscribe('userAnoProfiles', opts).then(function() {});


								$meteor.subscribe('notifications2').then(function() {
									$meteor.subscribe('conversations').then(function() {

										def.resolve('all subscribed');
										subscribed = true;

									});
								});


							});
						});
					});
				});
			});

			return def.promise;
		}



		return obj;

	}

})();