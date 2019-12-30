import {Client} from "@elastic/elasticsearch";
import Runner from './runner';
import Storage from './storage';
import Loader from "./loader";
import {Migration} from "./migration";
import {join} from 'path'

import yargs from 'yargs'

interface Configuration {
    root: string,
    migrations: string[]
    elasticsearch: string
    index: string
}

yargs.options({
    r: {alias: 'root', type: 'string', default: process.cwd()},
    m: {alias: 'migrations', type: 'array', default: ['./migrations/*.js']},
    e: {alias: 'elasticsearch', type: 'string', default: 'http://localhost:9200'},
    i: {alias: 'index', type: 'string', default: 'migrations'},
});
yargs.pkgConf('elasticsearch-migrate');

yargs.command({
    command: 'list',
    describe: 'List migrations',
    handler: async function(argv: Configuration) {
        const loader = new Loader(argv.root, argv.migrations);
        const client = getClient(argv);
        const storage = new Storage(client);
        const migrations = await loader.load();
        const last = await storage.getLastRevision();
        process.stdout.write('Migrations:\n-----------\n')
        migrations.forEach(function (migration) {
            process.stdout.write(`${migration.title === last ? '->' : '  '} ${migration.title}\n`)
        })
        await client.close();
    },
})

yargs.command({
    command: 'up',
    describe: 'Execute migrations in order',
    handler: async function(argv: Configuration) {
        const loader = new Loader(argv.root, argv.migrations);
        const runner = getRunner(argv);
        process.stdout.write('Running migrations...\n---------------------\n');
        await runner.up(await loader.load());
        await runner.client.close();
    }
})

yargs.command({
    command: 'down',
    describe: 'Rollback migrations',
    handler: async function(argv: Configuration) {
        const loader = new Loader(argv.root, argv.migrations);
        const runner = getRunner(argv);
        process.stdout.write('Running downward migrations...\n------------------------------\n');
        await runner.down(await loader.load());
        await runner.client.close();
    }
})

yargs.help()
    .demandCommand()
    .argv

function getClient(argv: Configuration) {
    if(typeof argv.elasticsearch === 'string') {
        if(argv.elasticsearch.match(/http/)) {
            return new Client({node: argv.elasticsearch});
        }
        else {
            return require(join(argv.root, argv.elasticsearch))
        }
    }
    return new Client(argv.elasticsearch);
}

function getRunner(argv: Configuration) {
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
