
# Speak Local(ly)

An imitation of the old [spocal.net](http://www.spocal.net).
**This is not professional work.**
It's unfinished work: It has more or less "full" functionality, but isn't scalable and some things are missing (e.g. good error handling).
I uploaded it on [meteor.com (deploy)](http://speaklocal.meteor.com). However, the server of speaklocal.meteor.com is free and feels a bit slow.

## Installation

* Download files
* Install meteor
* In main folder start the server with `meteor`
* Go to http://localhost:3000

## Main Issues (so far)

* Ok, testing works. But it's full of workarounds and not so intuitive.

* Long initial loading time: 4-6 seconds because of the meteor subscribtions. Haven't found a practical solution so far. 
* State change to `posts` (click on the home icon in the navbar) is a bit slow too. Main originator is a posts-query with sort(), which takes about 500ms.

Both issues didn't bother before adding several tousands of test rows to the db. I tried to solve it with limits in Meteor.publish() and extra Meteor.publish()'s for all needs, but the solution is not convincing.

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History

...

## Credits

Idea from spocal.net. Some are own ideas. Programming et all from myself (Fabio D'Elia).

## License

Apache License Version 2.0
