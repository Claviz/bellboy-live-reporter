import { IBellboyEvent } from "bellboy";

export interface IReporterConfig {
    url?: string;
}

export interface ReportData {
    events: IBellboyEvent[];
    reportFinished?: boolean;
}