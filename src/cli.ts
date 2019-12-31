import {join} from 'path'
import yargs from 'yargs'

yargs.options({
    r: {alias: 'root', type: 'string', default: process.cwd()},
    m: {alias: 'migrations', type: 'array', default: ['./migrations/*.js']},
    e: {alias: 'elasticsearch', type: 'string', default: 'http://localhost:9200'},
    i: {alias: 'index', type: 'string', default: 'migrations'},
});
yargs.pkgConf('elasticsearch-migrate')
    .commandDir(join(__dirname, 'commands'))
    .help()
    .demandCommand()
    .argv

