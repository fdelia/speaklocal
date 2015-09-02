describe('PostsCtrl', function() {
  beforeEach(module('app'));

  var $scope = null,
    $controller = null;

  beforeEach(inject(function(_$controller_) {
    $controller = _$controller_;
  }));

  beforeEach(inject(function($rootScope) {
    $scope = $rootScope.$new();
    controller = $controller('PostsCtrl', {
      $scope: $scope
    });
  }));

  it('exists', function() {
    expect(controller).not.toBeNull();
    expect($scope.posts).toEqual([]);
  });

});