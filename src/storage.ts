import {Client as ElasticsearchClient} from "@elastic/elasticsearch";

export default class Storage {
    client: ElasticsearchClient
    index: string
    constructor(client: ElasticsearchClient, index = 'migrations') {
        this.client = client;
        this.index = index;
    }
    async getLastRevision(): Promise<string|null> {
        await this.ensureMigrationsIndex();
        try {
            const doc = await this.client.get({
                index: this.index,
                id: 'last'
            })
            if(doc.body._source && doc.body._source.revision) {
                return doc.body._source.revision;
            }
        }
        catch(e) {
            // Swallow 404 errors - they just mean the index doesn't exist yet.
            if(!e.statusCode || e.statusCode !== 404) {
                throw e;
            }
        }

        return null;
    }
    async setLastRevision(revision: string|null) {
        await this.ensureMigrationsIndex();
        // @todo: Never do this until the index has been created.
        await this.client.index({
            index: this.index,
            id: 'last',
            body: {
                revision
            }
        })
    }
    async ensureMigrationsIndex() {
        const result = await this.client.indices.exists({
            index: this.index
        })
        if(result.statusCode === 404) {
            await this.client.indices.create({
                index: this.index,
                body: {
                    settings: {
                        number_of_shards: 1,
                        number_of_replicas: 1
                    },
                    mappings: {
                        properties: {
                            revision: {type: "keyword"}
                        }
                    }
                }
            })
        }
    }
}

