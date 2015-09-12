(function() {
	'use strict';

	angular.module('app').controller('UsersCtrl', UsersCtrl);
	UsersCtrl.$inject = ['UsersService'];

	function UsersCtrl(UsersService) {
		var vm = this;

		// TODO add pagination

		UsersService.getUsers()
			.then(function(data) {
				vm.users = data;
			});


	}

})();