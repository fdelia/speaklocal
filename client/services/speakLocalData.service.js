(function() {
	'use strict';


	angular.module('app').factory('speakLocalData', speakLocalData);
	speakLocalData.$inject = ['$meteor', '$q'];

	function speakLocalData($meteor, $q) {
		var service = {
			subscribeAll: subscribeAll,
			subscribePosts: subscribePosts,
			subscribeNavbar: subscribeNavbar
		};
		return service;



		var subscribed = false;

		function subscribePosts(opts) {
			var def = $q.defer();
			// dev
			// opts.skip = 0;
			// opts.limit = 10;
			// opts.postId = null;

			$meteor.subscribe('lastPosts', opts.skip, opts.limit, opts.postId).then(function() {
				// console.log('sub to lastPosts');
				// console.log(Posts.find().fetch());
				// console.log(AnonymousUsers.find().fetch());

				def.resolve('subscribed');
			});

			return def.promise;
		}

		function subscribeNavbar(opts) {
			var def = $q.defer();

			$meteor.subscribe('notifications2').then(function() {
				$meteor.subscribe('conversations').then(function() {
					def.resolve('subscribed');
				});
			});

			return def.promise;
		}

		function subscribeAll(opts) {
			var def = $q.defer();

			// TODO limits not yet in use
			opts = _.extend({
				postsLimit: 100,
				commentsLimit: 100,
				likesLimit: 500,

				notifsLimit: 100,
				convsLimit: 100
			}, opts);


			var s = Date.now();

			// Meteor docs say that there won't be a resubscribtion
			// But it's a bit faster when a second subscribtion is not even tried

			// Skip second subscribtion (if params unchanged)
			if (subscribed) {
				// TODO watch if a limit has changed
				def.resolve('already subscribed');
				return def.promise;
			}

			$meteor.subscribe('posts', opts.postsLimit).then(function() {
				$meteor.subscribe('comments', opts.commentsLimit).then(function() {
					$meteor.subscribe('likes', opts.likesLimit).then(function() {
						console.log('after post comments likes ' + (Date.now() - s));

						$meteor.subscribe('allUserData').then(function() {
							$meteor.subscribe('anoUsers').then(function() {
								$meteor.subscribe('userAnoProfiles').then(function() {});
								console.log('after anoProfiles ' + (Date.now() - s));

								$meteor.subscribe('notifications2', opts.notifsLimit).then(function() {
									$meteor.subscribe('conversations', opts.convsLimit).then(function() {

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

	}

})();