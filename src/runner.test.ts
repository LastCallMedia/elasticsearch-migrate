import { mocked } from 'ts-jest/utils'

import {Client} from '@elastic/elasticsearch';
import Runner from "./runner";
import Storage from './storage'
jest.mock('./storage');
jest.mock('@elastic/elasticsearch');

function migration(title: string) {
    return {
        title,
        up: jest.fn(),
        down: jest.fn()
    }
}

describe('Runner', function() {
    let client: Client;
    let storage: Storage;
    let lastRevision: string|null;

    beforeEach(function() {
        lastRevision = null;
        client = new Client();
        storage = new Storage(client);
        mocked(storage).setLastRevision.mockImplementation(async(rev) => {
            lastRevision = rev
        })
        mocked(storage).getLastRevision.mockImplementation(async() => {
            return lastRevision
        })
    })
    it('Up should execute the up method of any pending migrations', async function() {
        const a = migration('a');
        const b = migration('b');

        const runner = new Runner(client, storage);
        await runner.up([a, b])

        expect(a.up.mock.calls).toEqual([[client]]);
        expect(a.down.mock.calls).toEqual([])
        expect(b.up.mock.calls).toEqual([[client]]);
        expect(b.down.mock.calls).toEqual([])
    });
    it('Up should update the state after running migrations.', async function() {
        const a = migration('a');
        const b = migration('b');

        const runner = new Runner(client, storage);
        await runner.up([a, b])

        const mockedStorage = mocked(storage)
        expect(mockedStorage.getLastRevision.mock.calls.length).toEqual(1)
        expect(mockedStorage.setLastRevision.mock.calls).toEqual([['a'], ['b']])
    });
    it('Up should only run forward migrations.', async function() {
        const a = migration('a');
        const b = migration('b');

        const mockedStorage = mocked(storage)
        mockedStorage.getLastRevision.mockImplementationOnce(() => Promise.resolve('a'))
        const runner = new Runner(client, storage);
        await runner.up([a, b])

        expect(a.up.mock.calls.length).toEqual(0);
        expect(b.up.mock.calls.length).toEqual(1);
    });
    it('Up should not rerun any migrations if there are none left to run', async function() {
        const a = migration('a');
        const b = migration('b');

        const mockedStorage = mocked(storage)
        mockedStorage.getLastRevision.mockImplementationOnce(() => Promise.resolve('b'))
        const runner = new Runner(client, storage);
        await runner.up([a, b])

        expect(a.up.mock.calls.length).toEqual(0);
        expect(b.up.mock.calls.length).toEqual(0);
    });
    it('Up should not fail to run given an empty set', async function() {
        const runner = new Runner(client, storage);
        await runner.up([])
    });
    it('Up should throw an error when state refers to an empty migration', async function() {
        const a = migration('a');
        const mockedStorage = mocked(storage)
        mockedStorage.getLastRevision.mockImplementationOnce(() => Promise.resolve('b'))
        const runner = new Runner(client, storage);
        expect(runner.up([a])).rejects.toThrow('Unable to find migration b')
    });


    it('Down should execute the down method of any executed migrations', async function() {
        const a = migration('a');
        const b = migration('b');

        lastRevision = 'b'
        const runner = new Runner(client, storage);
        await runner.down([a, b])

        expect(a.up.mock.calls).toEqual([]);
        expect(a.down.mock.calls).toEqual([[client]])
        expect(b.up.mock.calls).toEqual([]);
        expect(b.down.mock.calls).toEqual([[client]])
    });
    it('Down should update the state after running migrations.', async function() {
        const a = migration('a');
        const b = migration('b');

        lastRevision = 'b'
        const runner = new Runner(client, storage);
        await runner.down([a, b])

        const mockedStorage = mocked(storage)
        expect(mockedStorage.getLastRevision.mock.calls.length).toEqual(1)
        expect(mockedStorage.setLastRevision.mock.calls).toEqual([['a'], [null]])
    });
    it('Down should only run backward migrations.', async function() {
        const a = migration('a');
        const b = migration('b');

        lastRevision = 'a'
        const runner = new Runner(client, storage);
        await runner.down([a, b])

        expect(a.down.mock.calls.length).toEqual(1);
        expect(b.down.mock.calls.length).toEqual(0);
    });
    it('Down should not rerun any migrations if there are none left to run', async function() {
        const a = migration('a');
        const b = migration('b');

        lastRevision = null;
        const runner = new Runner(client, storage);
        await runner.down([a, b])

        expect(a.up.mock.calls.length).toEqual(0);
        expect(b.up.mock.calls.length).toEqual(0);
    });
    it('Down should not fail to run given an empty set', async function() {
        const runner = new Runner(client, storage);
        await runner.down([])
    });
    it('Down should throw an error when state refers to an empty migration', async function() {
        lastRevision = 'b'
        const runner = new Runner(client, storage);
        expect(runner.down([migration('a')])).rejects.toThrow('Unable to find migration b')
    });





})
