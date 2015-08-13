(function() {
	'use strict';

	angular.module('app').controller('UserCtrl', UserCtrl);
	UserCtrl.$inject = ['$scope', '$stateParams', 'speakLocal', '$meteor'];

	function UserCtrl($scope, $stateParams, speakLocal, $meteor) {

		$scope.timeAgo = speakLocal.timeAgo;

		$scope.alerts = [];
		$scope.addAlert = addAlert;
		$scope.closeAlert = closeAlert;

		$scope.updateUser = updateUser;
		$scope.uploadImage = uploadImage;

		$scope.activities = [];

		$scope.$meteorSubscribe('allUserData').then(function() {

			var username = $stateParams.id;
			$scope.user = Meteor.users.findOne({
				username: username
			});

			if (!$scope.user) {
				$scope.addAlert('danger', 'User not found.');
				return false;
			}


			var opts = {
				userId: $scope.user._id
			}

			$meteor.subscribe('posts-byUser', opts).then(function() {
				$meteor.subscribe('comments-byUser', opts).then(function() {
					$meteor.subscribe('likes-byUser', opts).then(function() {
						var activityLog = {};

						var allElements = Posts.find({
							userId: $scope.user._id
						}).fetch();
						allElements = allElements.concat(Comments.find({
							userId: $scope.user._id
						}).fetch());
						allElements = allElements.concat(Likes.find({
							userId: $scope.user._id
						}).fetch());

						for (var i in allElements) {
							var el = allElements[i];
							activityLog[el.createdAt] = el;
						}

						// now sort by date
						function compareNumbers(a, b) {
							return b - a;
						}
						var sortedKeys = Object.keys(activityLog);
						sortedKeys.sort(compareNumbers);

						for (var i = 0; i < 20; i += 1) {
							var key = sortedKeys[i];
							if (!key) break;

							if (activityLog[key].on) {
								if (activityLog[key].type === 'post') {
									// subscribtion problem
									activityLog[key].onObj = Posts.findOne({
										_id: activityLog[key].on
									});
								}
							}
							$scope.activities.push(activityLog[key]);
						}

					});
				});
			});



		});


		function addAlert(type, msg) {
			$scope.alerts.push({
				type: type,
				msg: msg
			});
		};

		function closeAlert(index) {
			$scope.alerts.splice(index, 1);
		};

		function updateUser(username, bio) {
			// TODO bio is not being set -> profile.bio
			Meteor.call('updateProfile', $scope.currentUser._id, username, bio, function(err, res) {
				console.log(res);
			});

		}

		function uploadImage(userImage) {

			Meteor.call('updateUserImage', userImage, function(err, res) {
				// console.log(res);

				if (!res || err) {
					$scope.addAlert('danger', 'An error happened while uploading the image.');
					$scope.$apply(); // why is this needed here?
				} else {
					$scope.addAlert('success', 'Profile image was successfully uploaded.');
				}
			});
		}

	}

})();