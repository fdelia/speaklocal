
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

* Ok, testing works. But it's full of workarounds and not so intuitive (e.g. testing a promise).

I find it a bit disappointing to waste that much time on stackoverflow and blog posts just to make tests work... In my opinion tests should work out of the box.

_There is a [hack](https://forums.meteor.com/t/caching-subscription-ids-in-minimongo-to-vastly-simplify-client-side-querying/6166) to avoid the next two points. It makes a small mess in the code, but resolves the performance problems (I tried it out). However, I didn't want to invest more time into this project - so I left it as it was._

* Long initial loading time: 4-6 seconds because of the meteor subscribtions. Haven't found a practical solution so far. 
* That's a small issue: State change to `posts` (click on the home icon in the navbar) is a bit slow too. Main originator is a posts-query with sort(), which takes about 500ms. The same queries executed in the mongodb shell take all <5ms.

Both issues didn't bother before adding several tousands of test rows to the db. I tried to solve it with limits in Meteor.publish() and extra Meteor.publish()'s for all needs, but the solution is not convincing.

## Credits

Idea from spocal.net. Some are own ideas. Programming et all from myself (Fabio D'Elia).

## License

Apache License Version 2.0
