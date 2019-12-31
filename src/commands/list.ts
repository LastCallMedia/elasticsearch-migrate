import {Configuration, getClient} from "../cli.helper";
import Loader from "../loader";
import Storage from "../storage";

export const command = 'list'
export const describe = 'List migrations'
export const handler = async function(argv: Configuration) {
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
};
