(function() {
	'use strict';


	angular.module('app').factory('speakLocalData', speakLocalData);
	speakLocalData.$inject = ['$meteor', '$q'];

	function speakLocalData($meteor, $q) {
		var service = {
			subscribeAll: subscribeAll,
			subscribePosts: subscribePosts,
			subscribeNotifications: subscribeNotifications,
			subscribeConversations: subscribeConversations,
			subscribeConvWithAuthors: subscribeConvWithAuthors,
			subscribeUserList: subscribeUserList,
			subscribeUserByUsername: subscribeUserByUsername,
			subscribeNavbar: subscribeNavbar
		};
		return service;



		var subscribed = false;

		function subscribePosts(opts) {
			var def = $q.defer();
			$meteor.subscribe('lastPosts', opts.skip, opts.limit, opts.postId).then(function() {
				def.resolve('subscribed');
			});
			return def.promise;
		}

		function subscribeNotifications(opts) {
			var def = $q.defer();
			$meteor.subscribe('lastNotifications', opts.skip, opts.limit).then(function() {
				def.resolve('subscribed');
			});
			return def.promise;
		}

		function subscribeConversations(opts) {
			var def = $q.defer();

			$meteor.subscribe('lastConversations', opts.skip, opts.limit).then(function() {
				def.resolve('subscribed');
			});
			return def.promise;
		}

		function subscribeConvWithAuthors(convId) {
			var def = $q.defer();

			$meteor.subscribe('convWithAuthors', convId).then(function() {
				def.resolve('subscribed');
			});
			return def.promise;
		}

		function subscribeUserList(opts) {
			opts = _.extend({
				skip: 0,
				limit: 0
			}, opts);
			var def = $q.defer();

			$meteor.subscribe('userList', opts.skip, opts.limit).then(function() {
				def.resolve('subscribed');
			});
			return def.promise;
		}

		function subscribeUserByUsername(username) {
			var def = $q.defer();

			$meteor.subscribe('userByUsername', username).then(function() {
				def.resolve('subscribed');
			});
			return def.promise;
		}

		function subscribeNavbar() {
			var def = $q.defer();

			$meteor.subscribe('notifications2').then(function() {
				$meteor.subscribe('conversations').then(function() {
					def.resolve('subscribed');
				});
			});

			return def.promise;
		}

		function subscribeAll(opts) {
			console.info('Attention: using depreciated subscribeAll in speakLocalData');
			var def = $q.defer();

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

			// $meteor.subscribe('posts', opts.postsLimit).then(function() {
			// $meteor.subscribe('comments', opts.commentsLimit).then(function() {
			// $meteor.subscribe('likes', opts.likesLimit).then(function() {
			// console.log('after post comments likes ' + (Date.now() - s));

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
			// });
			// });
			// });

			return def.promise;
		}

	}

})();