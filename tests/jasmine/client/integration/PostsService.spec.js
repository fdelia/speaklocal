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
    var res;

    speakLocalData.subscribeAll()
    .then(function(data) {
      res = data;
      // expect(res).not.toBeNull();
      console.log('subscribed '+res);

      done();
    }).catch(function(err){
      console.log('error '+err);

    });

    expect(res).toBeUndefined();
    $rootScope.$apply();
    expect(res).not.toBeUndefined();
    // done();

    // expect(res).not.toBeNull();
  });

});