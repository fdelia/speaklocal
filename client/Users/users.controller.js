(function() {
	'use strict';

	angular.module('app').controller('UsersCtrl', UsersCtrl);
	UsersCtrl.$inject = ['UsersService'];

	function UsersCtrl(UsersService) {
		var vm = this;

		// TODO add pagination

		vm.users = UsersService.getUsers();


	}

})();