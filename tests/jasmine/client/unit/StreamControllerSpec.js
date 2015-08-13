describe('StreamController', function() {
  beforeEach(module('app'));

  var $scope = null;

  beforeEach(inject(function(_$controller_) {
    $controller = _$controller_;
  }));

  beforeEach(inject(function($rootScope) {
    $scope = $rootScope.$new();
    controller = $controller('StreamController', {
      $scope: $scope
    });
  }));

  it('exists', function(){
    expect(controller).not.toBeNull();
    expect(scope.posts).toExist();
  });

  it('should not add en empty post', function(){
    console.log(scope.posts.length);
    controller.addPost('', 'test text');

  })



  // var $controller = {},
  //   messages = {},
  //   $scope = {};
  // beforeEach(inject(function(_$controller_) {
  //   $controller = _$controller_;
  // }));

  // it('$scope should exist', function() {
  //   // var expected = [{
  //   //   _id: 1,
  //   //   text: 'my message'
  //   // }];
  //   // spyOn(messages, 'getCollection').and.returnValue(expected);
  //   $controller('StreamController', {
  //     $scope: $scope
  //     // messages: messages
  //   });
  //   expect($scope).toExist();
  //   // expect($scope.messages).toBe(expected);
  // });
});