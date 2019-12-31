import {Client} from "@elastic/elasticsearch";
import {join} from "path";
import Storage from "./storage";
import Runner from "./runner";
import {Migration} from "./migration";

export interface Configuration {
    root: string,
    migrations: string[]
    elasticsearch: string
    index: string
}

export function getClient(argv: Configuration) {
    if(typeof argv.elasticsearch === 'string') {
        if(argv.elasticsearch.match(/http/)) {
            return new Client({node: argv.elasticsearch});
        }
        else {
            let client = require(join(argv.root, argv.elasticsearch))
            if(!client) {
                throw new Error(`Unable to load client from ${argv.elasticsearch}. Did you mean to export a client object?`)
            }
            return 'default' in client ? client.default : client
        }
    }
    return new Client(argv.elasticsearch);
}

export function getRunner(argv: Configuration) {
    const client = getClient(argv);
    const storage = new Storage(client, argv.index);
    const runner = new Runner(client, storage);
    runner.on('up', (migration: Migration) => {
        process.stdout.write(`\u2713 ${migration.title}\n`)
    });
    runner.on('down', (migration: Migration) => {
        process.stdout.write(`\u2713 ${migration.title}\n`)
    })

    return runner;
}
