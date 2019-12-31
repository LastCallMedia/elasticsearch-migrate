import Loader from "../loader";
import {Configuration, getRunner} from "../cli.helper";

export const command = 'down';
export const describe = 'Rollback migrations';
export const handler = async function(argv: Configuration) {
    const loader = new Loader(argv.root, argv.migrations);
    const runner = getRunner(argv);
    process.stdout.write('Running downward migrations...\n------------------------------\n');
    await runner.down(await loader.load());
    await runner.client.close();
}
