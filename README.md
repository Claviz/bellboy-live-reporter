[![Build Status](https://travis-ci.org/Claviz/bellboy-live-reporter.svg?branch=master)](https://travis-ci.org/Claviz/bellboy-live-reporter)
[![codecov](https://codecov.io/gh/Claviz/bellboy-live-reporter/branch/master/graph/badge.svg)](https://codecov.io/gh/Claviz/bellboy-live-reporter)
![npm](https://img.shields.io/npm/v/bellboy-live-reporter.svg)

# bellboy-live-reporter

Send [bellboy](https://github.com/Claviz/bellboy) events as requests to the specified server endpoint.

* Requests never fail because of timeout. 
* If the server can't be reached, request retries to send an event until success.

These features and the fact that [bellboy jobs always wait for the code inside an event listener to complete](https://github.com/Claviz/bellboy#events-and-event-listeners-) allow a job to be executed gradually:
1. Reporter sends information about an event to the server.
2. The server accepts it, but doesn't respond to a request - the job is paused.
3. After some time or because of user interaction the server decides to send a response.
4. Reporter receives the response, continues the job till the next event and repeats all the steps again. 


## Installation
```
npm install bellboy-live-reporter
```

## Usage

```javascript
const bellboy = require('bellboy');
const LiveReporter = require('bellboy-live-reporter');

(async () => {
    const processor = new bellboy.DynamicProcessor({
        generator: async function* () {
            for (let i = 0; i < 100; i++) {
                yield { hello: `world_${i}` }
            }
        },
    });
    const destination = new bellboy.StdoutDestination();
    const job = new bellboy.Job(processor, [destination], {
        reporters: [
            new LiveReporter(),
        ],
    });
    await job.run();
})();
```

### Options

| option | type   | description                                                                                          |
|--------|--------|------------------------------------------------------------------------------------------------------|
| url    | string | Endpoint URL where requests will be sent. If not specified, `http://localhost:3041` address is used. |
## Building

You can build `js` source by using `npm run build` command.

## Testing

Tests can be run by using `npm test` command.
