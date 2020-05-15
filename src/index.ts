import axios from 'axios';
import { IBellboyEvent, Job, Reporter } from 'bellboy';

import { IReporterConfig, ReportData } from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let savedEvents: IBellboyEvent[] = [];
let condition: string;

async function poll(url: string, reportData: ReportData) {
    try {
        const response = await axios.post(url, reportData);
        savedEvents = [];
        condition = response.data?.toLowerCase();
        return;
    } catch (err) {
        const timeToWait = 3000;
        console.log(`Can't reach ${url}`);
        console.log(`Waiting ${timeToWait / 1000}s before reconnect...`);
        await delay(timeToWait);
        await poll(url, reportData);
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
            savedEvents.push(event);
            const reportFinished = event.eventName === 'endProcessing';
            if (reportFinished || !condition || (condition && JSON.stringify(event).toLowerCase().includes(condition))) {
                await poll(this.#url, { events: savedEvents, reportFinished });
            }
        });
    }
}

export = LogReporter;