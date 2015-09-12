
# Speak Local(ly)

An imitation of the old [spocal.net](http://www.spocal.net). It's unfinished work: Some functionality is missing.

I uploaded it on [meteor.com (deploy)](http://speaklocal.meteor.com). However, the server of speaklocal.meteor.com is free and is a little bit slow.

## Installation

* Install meteor
* Download files
* In main folder start the server with `meteor`
* Go to [http://localhost:3000](http://localhost:3000)

## Frameworks

Built with AngularJs (1.x), MeteorJs and Bootstrap.

## Main Issues (so far)

* Meteor (MongoDB) cursor has no .hasNext()??? Since it's not a MongoDB cursor... I don't want to fetch all the docs just to know if there are any result rows.

* Ok, testing works. But it's full of workarounds and not so intuitive (e.g. testing a promise).

I find it a bit disappointing to waste that much time on stackoverflow and blog posts just to make tests work... In my opinion tests should work out of the box.

Solve it with the aid of [this package](https://atmospherejs.com/reywood/publish-composite).
~~_There is a [hack](https://forums.meteor.com/t/caching-subscription-ids-in-minimongo-to-vastly-simplify-client-side-querying/6166) to avoid the next two points (discussion about it [here](https://forums.meteor.com/t/subscrbe-is-too-slow/5326)). It makes the code a bit less legible, but resolves the performance problems (I tried it out). However, I didn't want to invest more time into this project - so I left it as it was._

* Long initial loading time: 4-6 seconds because of the meteor subscribtions. Haven't found a practical solution so far. 
* That's a small issue: State change to `posts` (click on the home icon in the navbar) is a bit slow too. Main originator is a posts-query with sort(), which takes about 500ms. The same queries executed in the mongodb shell take all <5ms.~~

Both issues didn't bother before adding several tousands of test rows to the db. I tried to solve it with limits in Meteor.publish() and extra Meteor.publish()'s for all needs, but the solution is not convincing.

## Credits

Idea from spocal.net. Some are own ideas. Programming et all from myself (Fabio D'Elia).

## License

Apache License Version 2.0
