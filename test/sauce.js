#!/usr/bin/env node

/*
 * Copyright 2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 * @author Brian Cavalier
 * Original code from cujojs/test-support by Scott, heavily
 * modified by Brian for use in cujojs/when
 */

var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');
var json5 = require('json5');
var optimist = require('optimist');
var webdriver = require('wd');
var sauceConnect = require('sauce-connect-launcher');
var rest = require('rest');
var interceptor = require('rest/interceptor');
var basicAuthInterceptor = require('rest/interceptor/basicAuth');
var mimeInterceptor = require('rest/interceptor/mime');
var pathPrefixInterceptor = require('rest/interceptor/pathPrefix');

var when = require('../when');

var opts = optimist
	.boolean('m')
	.alias('m', 'manual')
	.describe('m', 'Opens a tunnel for manual test drives')
	.options('u', {
		alias: 'user',
		default: process.env.SAUCE_USERNAME || process.env.SELENIUM_USERNAME,
		demand: true,
		describe: 'Sauce Labs username, can be defined as an env var SAUCE_USERNAME'
	})
	.options('p', {
		alias : 'pass',
		default : process.env.SAUCE_ACCESS_KEY || process.env.SELENIUM_PASSWORD,
		demand: true,
		describe: 'Sauce Labs access key, can be defined as an env var SAUCE_ACCESS_KEY'
	})
	.options('remote-host', {
		default: process.env.SAUCE_HOST || process.env.SELENIUM_HOST || 'ondemand.saucelabs.com',
		describe: 'Hostname of Sauce Labs service'
	})
	.options('remote-port', {
		default: process.env.SAUCE_PORT || process.env.SELENIUM_PORT || 80,
		describe: 'Port of Sauce Labs service'
	})
	.options('port', {
		default: process.env.PORT || 8080,
		describe: 'Local port to run tunneled service, must be a tunnelable port'
	})
	.options('b', {
		alias: 'browsers',
		default: path.join(__dirname, 'browsers.json'),
		describe: 'path to browsers.json'
	})
	.options('t', {
		alias: 'timeout',
		default: process.env.SAUCE_JOB_TIMEOUT || 300, // 5 mins
		describe: 'Timeout per browser run, in seconds'
	})
	.argv;

opts.b = opts.browsers = json5.parse(
	fs.readFileSync(path.resolve(opts.browsers)).toString()
);

drive(opts);

/**
 * Distributed in browser testing with Sauce Labs
 */
function drive(opts) {
	/*jshint maxcomplexity:6*/
	'use strict';
	var suiteFailed = false;

	var username = opts.user;
	var accessKey = opts.pass;
	var travisJobNumber = process.env.TRAVIS_JOB_NUMBER || '';
	var travisCommit = process.env.TRAVIS_COMMIT || '';
	var tunnelIdentifier = travisJobNumber || Math.floor(Math.random() * 10000);

	if (travisJobNumber && !/\.1$/.test(travisJobNumber)) {
		// give up this is not the primary job for the build
		return;
	}

	var projectName;
	try {
		projectName = require('../package.json').name;
	}
	catch (e) {
		projectName = 'unknown';
	}

	var sauceRestClient = rest.wrap(mimeInterceptor, { mime: 'application/json' })
		.wrap(basicAuthInterceptor, { username: username, password: accessKey })
		.wrap(pathPrefixInterceptor, { prefix: 'http://saucelabs.com/rest/v1' });
	var passedStatusInterceptor = interceptor({
		request: function (passed, config) {
			return {
				method: 'put',
				path: '/{username}/jobs/{jobId}',
				params: {
					username: config.username,
					jobId: config.jobId
				},
				entity: {
					passed: passed
				}
			};
		}
	});

	// must use a port that sauce connect will tunnel
	var buster = launchBuster();

	console.log('Opening tunnel to Sauce Labs');

	sauceConnect({ username: username, accessKey: accessKey, tunnelIdentifier: tunnelIdentifier, 'no_progress': true }, function (err, tunnel) {

		if (err) {
			// some tunnel error occur as a normal result of testing
			console.error(err.stack || err);
			return;
		}

		console.log('Sauce Labs tunnel is ready for traffic');

		if (opts.manual) {
			// let the user run test manually, hold the tunnel open until this process is killed
			return;
		}

		runAutomatedTests(tunnel);
	});

	function launchBuster() {
		var buster = childProcess.spawn('npm', ['run', 'browser-test'], { stdio: 'pipe' });

		buster.stderr.on('data', function(data) {
			console.error(String(data));
		});

		buster.on('error', function(e) {
			console.error(e.stack || e);
		});

		return buster;
	}

	function runAutomatedTests (tunnel) {
		var browser = webdriver.promiseChainRemote(
			opts['remote-host'],
			opts['remote-port'],
			username,
			accessKey);

		browser.on('status', function (info) {
			console.log('\x1b[36m%s\x1b[0m', info);
		});
		browser.on('command', function (meth, path) {
			console.log(' > \x1b[33m%s\x1b[0m: %s', meth, path);
		});

		var outcome = opts.browsers.reduce(function (result, env) {
			return when(result, function () {
				return testWith(browser, env);
			});
		}, void 0);

		outcome.finally(function () {
			console.log('Stopping buster');
			buster.kill();

			console.log('Closing tunnel to Sauce Labs');
			tunnel.close();

			process.exit(suiteFailed ? 1 : 0);
		}).done();
	}

	function initEnvironment (environment) {
		environment.name = projectName + ' - ' +
			(travisJobNumber
				? travisJobNumber + ' - '
				: '') +
			environment.browserName + ' ' + (environment.version || 'latest') +
			' on ' + (environment.platform || 'any platform');
		environment.build = travisJobNumber
			? travisJobNumber + ' - ' + travisCommit
			: 'manual';
		environment['tunnel-identifier'] = tunnelIdentifier;
		environment['max-duration'] = opts.timeout;

		// most info is below the fold, so images are not helpful, html source is
		environment['record-video'] = false;
		environment['record-screenshots'] = false;
		environment['capture-html'] = true;

		return environment;
	}

	function testWith(browser, environment) {
		var updateEnvironmentPassedStatus;

		return browser.init(initEnvironment(environment))
			.then(function(sessionID) {
				console.log('Testing ' + environment.name);
				updateEnvironmentPassedStatus = sauceRestClient.wrap(passedStatusInterceptor, { username: username, jobId: sessionID });
				return sessionID;
			})
			.setImplicitWaitTimeout(3e4)
			.get('http://127.0.0.1:' + opts.port + '/')
			.elementByCssSelector('.stats h2')
			.text()
			.then(function(text) {
				environment.passed = /ok/i.test(text);
			})
			.catch(function(e) {
				console.log(e.stack);
				environment.passed = false;
				environment.error = e;
				suiteFailed = true;
			})
			.quit(function() {
				if (!environment.passed) {
					suiteFailed = true;
				}

				console.log((environment.passed ? 'PASS' : 'FAIL') + ' ' + environment.name);

				if (suiteFailed && updateEnvironmentPassedStatus) {
					return updateEnvironmentPassedStatus(false).thenReject(environment.error);
				} else {
					return updateEnvironmentPassedStatus(environment.passed);
				}
			});
	}
}

