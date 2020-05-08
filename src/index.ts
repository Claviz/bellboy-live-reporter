import axios from 'axios';
import { IBellboyEvent, Job, Reporter } from 'bellboy';

import { IReporterConfig } from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function poll(url: string, event: IBellboyEvent) {
    try {
        await axios.post(url, event);
        return;
    } catch (err) {
        const timeToWait = 3000;
        console.log(`Can't reach ${url}`);
        console.log(`Waiting ${timeToWait / 1000}s before reconnect...`);
        await delay(timeToWait);
        await poll(url, event);
    }
}
class LogReporter extends Reporter {

    #url: string;

    constructor(config?: IReporterConfig) {
        super();
        this.#url = config?.url || '';
    }

    report(job: Job) {
        this.#url = this.#url ? this.#url : `http://localhost:3041`;
        job.onAny(undefined, async (event) => {
            await poll(this.#url, event);
        });
    }
}

export = LogReporter;