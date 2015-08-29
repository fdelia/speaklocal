(function() {
	'use strict';

	angular.module('app').controller('UserlistCtrl', UserlistCtrl);
	UserlistCtrl.$inject = ['$meteor'];

	function UserlistCtrl($meteor) {
		var vm = this;

		// $meteor.subscribe('allUserData').then(function() {
		vm.users = Meteor.users.find().fetch();
		// });
	}

})();