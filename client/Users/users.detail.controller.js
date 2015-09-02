(function() {
	'use strict';

	angular.module('app').controller('UserCtrl', UserCtrl);
	UserCtrl.$inject = ['$scope', '$state', 'speakLocal', 'UsersService'];

	function UserCtrl($scope, $state, speakLocal, UsersService) {
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

		var username = $state.params.id;
		$scope.user = UsersService.getUserByUsername(username);

		if (!$scope.user) {
			$scope.addAlert('danger', 'User not found.');
			return false;
		}

		$scope.activities = $scope.activities.concat(UsersService.getActivities($scope.user._id));

		// count likes that this user received
		UsersService.countLikesFromUser($scope.user._id)
			.then(function(data) {
				$scope.numberOfLikes = data;
			}, function(err) {

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
			UsersService.updateUser($scope.user._id, username, bio)
				.then(function(data) {
					$scope.addAlert('success', 'Successfully updated.');
				}, function(err) {
					$scope.addAlert('warning', 'Error: ' + err.reason);
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
			// TODO myCroppedImage is always empty
			// work around for the moment
			console.log($scope.image.croppedImg);
			$scope.image.croppedImg = $scope.image.orgImg;

			if ($scope.image.croppedImg !== '') {
				UsersService.updateUserImage($scope.image.croppedImg)
					.then(function(data) {
						$scope.addAlert('success', 'Profile image was successfully uploaded.');
					}, function(err) {
						$scope.addAlert('danger', 'Error: ' + err.reason);
					});
			} else {
				console.error('myCroppedImage === ""');
			}
		}

	}

})();