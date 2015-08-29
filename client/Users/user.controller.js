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

		$scope.user = null;
		$scope.activities = [];
		$scope.numberOfLikes = 0;

		$scope.addImages = addImages;
		$scope.saveCroppedImage = saveCroppedImage;

		$scope.$meteorSubscribe('allUserData').then(function() {

			var username = $stateParams.id;
			$scope.user = Meteor.users.findOne({
				username: username
			});


			if (!$scope.user) {
				$scope.addAlert('danger', 'User not found.');
				return false;
			}


			// count likes that this user received
			Meteor.call('countLikesFromUser', $scope.user._id, function(err, res) {
				$scope.numberOfLikes = res;
			});


			// build user activity list
			var opts = {
				userId: $scope.user._id
			};

			var activityLog = {};


			// get all "activity elements"
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

			// sort by date
			function compareNumbers(a, b) {
				return b - a;
			}
			var sortedKeys = Object.keys(activityLog);
			sortedKeys.sort(compareNumbers);

			for (var i = 0; i < 20; i += 1) {
				var key = sortedKeys[i];
				if (!key) break;

				// add aditional data

				// only for likes (only likes have .on)
				if (activityLog[key].on) {

					if (activityLog[key].type === 'post') {
						// subscribtion problem
						activityLog[key].post = Posts.findOne({
							_id: activityLog[key].on
						});
					}

					if (activityLog[key].type === 'comment') {
						activityLog[key].comm = Comments.findOne({
							_id: activityLog[key].on
						});
						if (!activityLog[key].comm || !activityLog[key].comm.postId) return;
						activityLog[key].post = Posts.findOne({
							_id: activityLog[key].comm.postId
						});
					}
				}
				$scope.activities.push(activityLog[key]);
			}




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


		// image upload
		$scope.image = {
			orgImg: '',
			croppedImg: ''
		}

		function addImages(files) {
			var file = files[0]; // take only the first one
			if (!file) {
				// console.error('no file found');
				return void(0);
			}
			var reader = new FileReader();

			reader.onload = function(e) {
				$scope.$apply(function() {
					$scope.image.orgImg = e.target.result;
				});
			};

			reader.readAsDataURL(file);
		}

		function saveCroppedImage() {
			// TODO myCroppdeImage is always empty
			// work around for the moment
			console.log($scope.image.croppedImg);
			$scope.image.croppedImg = $scope.image.orgImg;

			if ($scope.image.croppedImg !== '') {
				Meteor.call('updateUserImage', $scope.image.croppedImg, function(err, res) {

					if (err) {
						$scope.addAlert('danger', 'Error: ' + err.reason);
						// $scope.$apply(); // why is this needed here?
					} else {
						$scope.addAlert('success', 'Profile image was successfully uploaded.');
					}
				});

			} else {
				console.error('myCroppedImage === ""');
			}
		}

	}

})();