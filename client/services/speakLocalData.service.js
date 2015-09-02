(function() {
	'use strict';


	angular.module('app').factory('speakLocalData', speakLocalData);
	speakLocalData.$inject = ['$meteor', '$q'];

	function speakLocalData($meteor, $q) {
		var obj = {
			subscribeAll: subscribeAll
		};

		var subscribed = false;
		// var postsLimitBefore = false;

		function subscribeAll(postsLimit) {
			var def = $q.defer();
			// postsLimit = postsLimit ? postsLimit : 30;

			var s = Date.now();

			// Meteor docs say that there won't be a resubscribtion
			// But it's a bit faster when a second subscribtion is not even tried

			// Skip second subscribtion (if params unchanged)
			if (subscribed) {
				def.resolve('already subscribed');
				return def.promise;
			}

			$meteor.subscribe('posts').then(function() {
				$meteor.subscribe('comments').then(function() {
					$meteor.subscribe('likes').then(function() {

						$meteor.subscribe('allUserData').then(function() {
							$meteor.subscribe('anoUsers').then(function() {
								$meteor.subscribe('userAnoProfiles').then(function() {});


								$meteor.subscribe('notifications2').then(function() {
									$meteor.subscribe('conversations').then(function() {

										console.log('subscribeAll ' + (Date.now() - s));
										def.resolve('all subscribed');
										subscribed = true;
										// postsLimitBefore = postsLimit;

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