describe('PostsService', function() {
  beforeEach(module('app'));

  var PostsService, speakLocalData, rootScope;
  beforeEach(inject(function($rootScope, _PostsService_, _speakLocalData_) {
    rootScope = $rootScope;
    PostsService = _PostsService_;
    speakLocalData = _speakLocalData_;
  }));


  it('exists', function() {
    expect(PostsService).not.toBeNull();
  });

  it('addPost', function() {
    // console.log(speakLocalData.subscribeAll());
    var res = null;
    speakLocalData.subscribeAll().then(function(data) {
      // PostsService.addPost('', 'test')
      res = data;
      console.log('subscribed '+res);
    }, function(err){
      console.log('error '+err);
    });

    console.log(PostsService.loadPosts());
    console.log(res);
    expect(res).not.toBeNull();
  });

});