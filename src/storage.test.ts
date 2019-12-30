import {Client} from '@elastic/elasticsearch';
import Storage from "./storage";

// Conditionally skip this entire suite if ELASTICSEARCH_URI hasn't been set up.
const descriptor = process.env.ELASTICSEARCH_URI ? describe : describe.skip;

descriptor('Storage', function() {
    let client: Client
    let index: string

    beforeEach(function() {
        index = `migrations-${Math.round(Math.random() * 1000)}`
        client = new Client({
            node: process.env.ELASTICSEARCH_URI,
        });
    })
    afterEach(async function() {
        try {
            await client.indices.delete({
                index: index
            })
        } catch(e) {
            if(e.statusCode === 404) {
                // Index not found - don't worry about it.
                return;
            }
            throw e
        }
    });

    it('Should start at the default revision', async function() {
        const storage = new Storage(client, index);
        const revision = await storage.getLastRevision();
        expect(revision).toBeNull();
    });
    it('Should create the index on the fly.', async function() {
        const storage = new Storage(client, index);
        await storage.getLastRevision();
        const indexExists = client.indices.exists({index})
        await expect(indexExists).resolves.toBeTruthy();
    });

    it('Should write the migration status to the index', async function() {
        const storage = new Storage(client, index);
        await storage.setLastRevision('123');
        const record = client.get({index, id: 'last'});
        await expect(record).resolves.toEqual(
            expect.objectContaining({
                body: expect.objectContaining({
                    _source: {revision: '123'}
                })
            })
        )
    });

    it('Should read the migration status from the index', async function() {
        const storage = new Storage(client, index);
        await storage.setLastRevision('123');
        await expect(storage.getLastRevision()).resolves.toEqual('123');
    });

    it('Should allow the migration status to be brought all the way back down without throwing an error', async function() {
        const storage = new Storage(client, index);
        await storage.setLastRevision(null);
        await expect(storage.getLastRevision()).resolves.toBeNull();
    })
})
