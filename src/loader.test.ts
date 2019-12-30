import Loader from "./loader";
import {join} from "path"

describe('Loader', function() {
    const fixtures = join(__dirname, '..', 'fixtures');

    it('Should reject non-js files', async function() {
        const loader = new Loader(fixtures, 'broken.txt');
        await expect(loader.load()).rejects.toThrowError('Unable to load migration from broken.txt - this does not look like a JS file.');
    });
    it('Should reject files that do not export a migration.', async function() {
        const loader = new Loader(fixtures, 'empty.js');
        await expect(loader.load()).rejects.toThrowError('Unable to load migration from empty.js - this file needs to export an object');
    });
    it('Should resolve an OK migration', async function() {
        const loader = new Loader(fixtures, 'ok1.js');
        await expect(loader.load()).resolves.toEqual([
            expect.objectContaining({title: 'OK1'})
        ]);
    });
    it('Should sort migrations by title', async function() {
        const loader = new Loader(fixtures, ['ok2.js', 'ok1.js']);
        await expect(loader.load()).resolves.toEqual([
            expect.objectContaining({title: 'OK1'}),
            expect.objectContaining({title: 'OK2'})
        ]);
    });
    it('Should require a unique name for each migration', async function() {
        const loader = new Loader(fixtures, ['ok1.js', 'dup-ok1.js']);
        await expect(loader.load()).rejects.toThrowError('Duplicate migration detected: OK1');
    })
})
