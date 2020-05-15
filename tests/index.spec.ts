import { Destination, DynamicProcessor, IBellboyEvent, Job } from 'bellboy';
import express from 'express';
import { Server } from 'http';

import LiveReporter from '../src';
import { ReportData } from '../src/types';

let data: ReportData[] = [];

function startServer(opts?: { simulateFailOnce?: boolean; port?: number; }): Server {
    function mockChangingData(reportData: ReportData) {
        const changed = {
            ...reportData,
            events: reportData.events.map(x => ({ ...x, jobId, timestamp, eventId: `event${timestamp}` })),
        };
        timestamp += 1;

        return changed;
    }
    const jobId = 'job1';
    let timestamp = 0;
    let firstTime = true;
    const app = express();
    app.use(express.json());
    app.post('/', function (req: any, res: any) {
        const body = req.body as ReportData;
        data.push(mockChangingData(body));
        res.send(firstTime && opts?.simulateFailOnce ? 404 : undefined);
        firstTime = false;
    });
    app.post('/with-condition', function (req: any, res: any) {
        const body = req.body as ReportData;
        data.push(mockChangingData(body));
        res.send(firstTime && opts?.simulateFailOnce ? 404 : 'something_3');
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
    await job.run();
    expect(data).toMatchSnapshot();
    server.close();
});

it('successfully sends event requests to the custom server endpoint', async () => {
    const port = 3042;
    const server = startServer({ port: port });
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
    await job.run();
    expect(data).toMatchSnapshot();
    server.close();
});

it('retries to send an event to the server on fail', async () => {
    const server = startServer({ simulateFailOnce: true });
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
    await job.run();
    expect(data).toMatchSnapshot();
    server.close();
});

it('if condition is set, waits for it before sending events', async () => {
    const server = startServer();
    const processor = new DynamicProcessor({
        generator: async function* () {
            for (let i = 0; i < 5; i++) {
                yield {
                    text: `something_${i}`
                }
            }
        },
    });
    const destination = new CustomDestination();
    const job = new Job(processor, [destination], { reporters: [new LiveReporter({ url: `http://localhost:3041/with-condition` })] });
    await job.run();
    expect(data).toMatchSnapshot();
    server.close();
});