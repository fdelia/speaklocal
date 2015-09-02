describe('PostsService', function() {
  beforeEach(module('app'));

  var PostsService, speakLocalData, $timeout, $rootScope;
  beforeEach(inject(function(_$timeout_, _$rootScope_, _PostsService_, _speakLocalData_) {
    $timeout = _$timeout_;
    $rootScope = _$rootScope_;
    PostsService = _PostsService_;
    speakLocalData = _speakLocalData_;
  }));


  it('exists', function() {
    expect(PostsService).not.toBeNull();
  });

  it('addPost', function(done) {
    speakLocalData.subscribeAll()
    .then(function(data) {
      expect(res).not.toBeNull();
      console.log('subscribed '+res);
    }, function(err){
      console.log('error '+err);
    });

    $rootScope.$apply();
    done();

    // expect(res).not.toBeNull();
  });

});