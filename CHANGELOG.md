# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.15.3"></a>
## [1.15.3](https://github.com/BasedAKP48/Utils/compare/v1.15.2...v1.15.3) (2018-03-30)


### Bug Fixes

* **ensureRequired:** validate arguments ([d511ce8](https://github.com/BasedAKP48/Utils/commit/d511ce8))
* timeReceived is deprecated ([26a6011](https://github.com/BasedAKP48/Utils/commit/26a6011))



<a name="1.15.2"></a>
## [1.15.2](https://github.com/BasedAKP48/Utils/compare/v1.15.1...v1.15.2) (2018-03-26)


### Bug Fixes

* **response:** Data is optional, so it must be null if undefined ([2d73566](https://github.com/BasedAKP48/Utils/commit/2d73566))



<a name="1.15.1"></a>
## [1.15.1](https://github.com/BasedAKP48/Utils/compare/v1.15.0...v1.15.1) (2018-03-25)


### Bug Fixes

* **database:** Use correct args for initialize ([5480d3c](https://github.com/BasedAKP48/Utils/commit/5480d3c))
* **response:** Remove message from queue ([4bb2960](https://github.com/BasedAKP48/Utils/commit/4bb2960))


### Features

* Add "patch" and "cleanDB" scripts ([9fe5f7f](https://github.com/BasedAKP48/Utils/commit/9fe5f7f))



<a name="1.15.0"></a>
# [1.15.0](https://github.com/BasedAKP48/Utils/compare/1.14.0...1.15.0) (2018-03-24)


### Bug Fixes

* **eventForwarder:** forwarded event prefix must be a string ([e9231bf](https://github.com/BasedAKP48/Utils/commit/e9231bf))
* **response:** EventEmitter is not Firebase ([4529cba](https://github.com/BasedAKP48/Utils/commit/4529cba))


### Features

* **build:** add standard-version for releases ([b485936](https://github.com/BasedAKP48/Utils/commit/b485936))



<a name="1.14.0"></a>
# 1.14.0 (2018-02-21)


### Bug Fixes

* Allow presenceSystem to be created more than once ([53bffe1](https://github.com/BasedAKP48/plugin-utils/commit/53bffe1))
* breaking: getCID must update to {options} ([75cc3c1](https://github.com/BasedAKP48/plugin-utils/commit/75cc3c1))
* check for variables, not methods ([f252688](https://github.com/BasedAKP48/plugin-utils/commit/f252688))
* Don't forward 'delete' ([3f7f0e9](https://github.com/BasedAKP48/plugin-utils/commit/3f7f0e9))
* Ensure CID's are safe (everywhere) ([e973b66](https://github.com/BasedAKP48/plugin-utils/commit/e973b66))
* Filepath is now pointed correctly in utils.getCID ([27bf625](https://github.com/BasedAKP48/plugin-utils/commit/27bf625))
* Initialize only once per creation ([3ad2c31](https://github.com/BasedAKP48/plugin-utils/commit/3ad2c31))
* Initialize should be using require, instead of passing the module ([415978a](https://github.com/BasedAKP48/plugin-utils/commit/415978a))
* match event names to standards ([72755ba](https://github.com/BasedAKP48/plugin-utils/commit/72755ba))
* on('message/type') is now properly lower-cased ([0a4ea01](https://github.com/BasedAKP48/plugin-utils/commit/0a4ea01))
* only care about initial state of afk and offline if they're true ([dd89ae5](https://github.com/BasedAKP48/plugin-utils/commit/dd89ae5))
* plugin.emit('config') ([d27f2f4](https://github.com/BasedAKP48/plugin-utils/commit/d27f2f4))
* remove logging ([a50620c](https://github.com/BasedAKP48/plugin-utils/commit/a50620c))
* sendText should use sendMessage ([2dccbe4](https://github.com/BasedAKP48/plugin-utils/commit/2dccbe4))
* update PresenceSystem export to match its new class status ([fc5cbb5](https://github.com/BasedAKP48/plugin-utils/commit/fc5cbb5))
* Use utils.getSafeObject in presenceSystem ([0a1284d](https://github.com/BasedAKP48/plugin-utils/commit/0a1284d))
* visibility/naming of presence system internals ([930d999](https://github.com/BasedAKP48/plugin-utils/commit/930d999))
* **getReply:** Properly set targets for replies ([061a054](https://github.com/BasedAKP48/plugin-utils/commit/061a054))
* **messaging:** Only apply CID to outgoing ([e68b94a](https://github.com/BasedAKP48/plugin-utils/commit/e68b94a))
* **plugin:** Options are optional ([f254da5](https://github.com/BasedAKP48/plugin-utils/commit/f254da5))
* **plugin:** Responses weren't tagged 'internal' ([2206ffe](https://github.com/BasedAKP48/plugin-utils/commit/2206ffe))


### Code Refactoring

* convert PresenceSystem to a factory function ([a9ddc46](https://github.com/BasedAKP48/plugin-utils/commit/a9ddc46))


### Features

* Actually add the test file perhaps ([6e78639](https://github.com/BasedAKP48/plugin-utils/commit/6e78639))
* add CircleCI integration ([7328f87](https://github.com/BasedAKP48/plugin-utils/commit/7328f87))
* Add database util files ([8661959](https://github.com/BasedAKP48/plugin-utils/commit/8661959))
* Add plugin classes, that auto loads defaults ([b5451b7](https://github.com/BasedAKP48/plugin-utils/commit/b5451b7))
* Add singular "status" key ([4acd052](https://github.com/BasedAKP48/plugin-utils/commit/4acd052))
* afk and offline events to listen for from PresenceSystem ([e10af46](https://github.com/BasedAKP48/plugin-utils/commit/e10af46))
* Allow presence to generate a (temporary) CID for you ([ab12394](https://github.com/BasedAKP48/plugin-utils/commit/ab12394))
* cid is required in subsystems ([50730fb](https://github.com/BasedAKP48/plugin-utils/commit/50730fb))
* Config service ([d6281d0](https://github.com/BasedAKP48/plugin-utils/commit/d6281d0))
* configuration event for all modules ([aef8bc0](https://github.com/BasedAKP48/plugin-utils/commit/aef8bc0))
* Connector.on('config') ([5fe8198](https://github.com/BasedAKP48/plugin-utils/commit/5fe8198))
* convert presence system to EventEmitter class ([42afc75](https://github.com/BasedAKP48/plugin-utils/commit/42afc75))
* database move function ([30181be](https://github.com/BasedAKP48/plugin-utils/commit/30181be))
* Emit messages directed to the plugins CID ([6c4acb1](https://github.com/BasedAKP48/plugin-utils/commit/6c4acb1))
* event forwarding (with tests!) ([9e2ccae](https://github.com/BasedAKP48/plugin-utils/commit/9e2ccae))
* Expose eventForwarder ([c319f74](https://github.com/BasedAKP48/plugin-utils/commit/c319f74))
* Extract utils.safeString so you can prep any key, not just object keys ([006868d](https://github.com/BasedAKP48/plugin-utils/commit/006868d))
* getCID now uses "options", added options.cidPath ([9fad092](https://github.com/BasedAKP48/plugin-utils/commit/9fad092))
* instanceName and listenMode aren't required ([345db3a](https://github.com/BasedAKP48/plugin-utils/commit/345db3a))
* isUnsafe(string) ([18e516a](https://github.com/BasedAKP48/plugin-utils/commit/18e516a))
* messaging system ([1b162ce](https://github.com/BasedAKP48/plugin-utils/commit/1b162ce))
* plugin.on('message-in/out') ([b230555](https://github.com/BasedAKP48/plugin-utils/commit/b230555))
* Presence now emits general messages ([6c5575a](https://github.com/BasedAKP48/plugin-utils/commit/6c5575a))
* Support "options.dir" in plugins ([56811a6](https://github.com/BasedAKP48/plugin-utils/commit/56811a6))
* util.getReply, from existing message ([c4dc009](https://github.com/BasedAKP48/plugin-utils/commit/c4dc009))
* util.initialize, for FirebaseAdmin ([8376912](https://github.com/BasedAKP48/plugin-utils/commit/8376912))
* utils for presence system and ensuring required options ([a6f1f0d](https://github.com/BasedAKP48/plugin-utils/commit/a6f1f0d))
* **build:** add standard-version for releases ([b485936](https://github.com/BasedAKP48/plugin-utils/commit/b485936))
* **eventForwarder:** Exclude events ([bc86935](https://github.com/BasedAKP48/plugin-utils/commit/bc86935))
* **getReply:** Include optional data to reply ([5f11636](https://github.com/BasedAKP48/plugin-utils/commit/5f11636))
* **messaging:** Apply uid to outgoing messages ([befc95a](https://github.com/BasedAKP48/plugin-utils/commit/befc95a))
* **plugin:** Send internal messages ([3787e25](https://github.com/BasedAKP48/plugin-utils/commit/3787e25))
* **plugin:** sendError's to database ([b850678](https://github.com/BasedAKP48/plugin-utils/commit/b850678))
* **presence:** setName ([cf8b241](https://github.com/BasedAKP48/plugin-utils/commit/cf8b241))
* utils.getCID ([35aa1a9](https://github.com/BasedAKP48/plugin-utils/commit/35aa1a9))
* utils.getCID(root) to get a key without persistence ([628bf79](https://github.com/BasedAKP48/plugin-utils/commit/628bf79))
* utils.getSafeObject ([d961511](https://github.com/BasedAKP48/plugin-utils/commit/d961511))
* Webhook service ([92ec77b](https://github.com/BasedAKP48/plugin-utils/commit/92ec77b))


### BREAKING CHANGES

* Plugins will now need to provide their own CID to PresenceSystem and MessagingSystem. If they
do not have a CID and want to use a temporary CID, they'll need to call `Utils.getCID()` on
their own and use that.
* consumers will need to remove the 'new' keyword from their instantiation of PresenceSystem.
