(function() {
	'use strict';

	angular.module('app').controller('UserListCtrl', UserListCtrl);
	UserListCtrl.$inject = ['$meteor'];

	function UserListCtrl($meteor) {
		var vm = this;

		// $meteor.subscribe('allUserData').then(function() {
		vm.users = Meteor.users.find().fetch();
		// });
	}

})();