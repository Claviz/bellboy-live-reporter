import { Destination, DynamicProcessor, IBellboyEvent, Job } from 'bellboy';
import express from 'express';
import { Server } from 'http';

import LiveReporter from '../src';

let data: any[] = [];

function startServer(opts?: { simulateFailOnce?: boolean; port?: number; }): Server {
    let firstTime = true;
    const app = express();
    app.use(express.json());
    app.post('/', function (req: any, res: any) {
        data.push(req.body);
        res.send(firstTime && opts?.simulateFailOnce ? 404 : undefined);
        firstTime = false;
    });
    const server = app.listen(opts?.port ? opts.port : 3041);

    return server;
}

beforeAll(async () => {
});

beforeEach(async () => {
    data = [];
});

afterAll(async () => {
});

afterEach(async () => {
});

class CustomDestination extends Destination {
    async loadBatch(rows: any) {
        // do nothing
    }
}

it('successfully sends event requests to the server', async () => {
    const server = startServer();
    const events: IBellboyEvent[] = [];
    const processor = new DynamicProcessor({
        generator: async function* () {
            for (let i = 0; i < 3; i++) {
                yield {
                    text: 'something'
                }
            }
        },
    });
    const destination = new CustomDestination();
    const job = new Job(processor, [destination], { reporters: [new LiveReporter()] });
    job.onAny(undefined, async (event) => events.push(event));
    await job.run();
    expect(JSON.stringify(events)).toEqual(JSON.stringify(data));
    server.close();
});

it('successfully sends event requests to the custom server endpoint', async () => {
    const port = 3042;
    const server = startServer({ port: port });
    const events: IBellboyEvent[] = [];
    const processor = new DynamicProcessor({
        generator: async function* () {
            for (let i = 0; i < 3; i++) {
                yield {
                    text: 'something'
                }
            }
        },
    });
    const destination = new CustomDestination();
    const job = new Job(processor, [destination], { reporters: [new LiveReporter({ url: `http://localhost:${port}` })] });
    job.onAny(undefined, async (event) => events.push(event));
    await job.run();
    expect(JSON.stringify(events)).toEqual(JSON.stringify(data));
    server.close();
});

it('retries to send an event to the server on fail', async () => {
    const server = startServer({ simulateFailOnce: true });
    const events: IBellboyEvent[] = [];
    const processor = new DynamicProcessor({
        generator: async function* () {
            for (let i = 0; i < 3; i++) {
                yield {
                    text: 'something'
                }
            }
        },
    });
    const destination = new CustomDestination();
    const job = new Job(processor, [destination], { reporters: [new LiveReporter()] });
    job.onAny(undefined, async (event) => events.push(event));
    await job.run();
    expect(JSON.stringify([events[0], ...events])).toEqual(JSON.stringify(data));
    server.close();
});
