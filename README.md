# Development

* Run `gulp`

Depending on whether you want to host a local deepstream server too:

* Run `node deepstream.js`
* Update `availableServers` in `src/javascripts/communication.js`, add localhost

# Production

* Run `gulp production`
* Run `node deepstream.js`
* Server should now be available at port 8081, or whatever port you set in the PORT environment var.

## TODO

* [update webvr api use](https://github.com/w3c/webvr/blob/gh-pages/migration.md)
