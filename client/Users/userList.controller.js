(function() {
	'use strict';

	angular.module('app').controller('UserlistCtrl', UserlistCtrl);
	UserlistCtrl.$inject = [];

	function UserlistCtrl(){
		var vm = this;

		vm.users = Meteor.users.find().fetch();
	}

})();