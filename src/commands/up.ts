import Loader from "../loader";
import {Configuration, getRunner} from "../cli.helper";

export const command = 'up';
export const describe = 'Execute migrations in order';
export const handler = async function(argv: Configuration) {
    const loader = new Loader(argv.root, argv.migrations);
    const runner = getRunner(argv);
    process.stdout.write('Running migrations...\n---------------------\n');
    await runner.up(await loader.load());
    await runner.client.close();
}
