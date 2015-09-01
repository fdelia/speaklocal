(function() {
	'use strict';

	angular.module('app').controller('UsersCtrl', UsersCtrl);
	UsersCtrl.$inject = ['$meteor'];

	function UsersCtrl($meteor) {
		var vm = this;

		// $meteor.subscribe('allUserData').then(function() {
		vm.users = Meteor.users.find().fetch();
		// });
	}

})();