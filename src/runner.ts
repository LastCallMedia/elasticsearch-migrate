import {Client as ElasticsearchClient} from "@elastic/elasticsearch";
import Storage from "./storage";
import {MigrationSet} from "./migration";
import {EventEmitter} from "events";

export default class Runner extends EventEmitter {
    client: ElasticsearchClient
    storage: Storage

    constructor(client: ElasticsearchClient, storage: Storage) {
        super();
        this.client = client
        this.storage = storage
    }
    async up(set: MigrationSet) {
        const state = await this.storage.getLastRevision();
        if(state !== null) {
            return this.executeUp(set.slice(this.findPositionInSet(state, set) + 1));
        }
        else {
            return this.executeUp(set);
        }
    }
    async down(set: MigrationSet) {
        const reversed = set.reverse();
        const state = await this.storage.getLastRevision();
        if(state !== null) {
            return this.executeDown(reversed.slice(this.findPositionInSet(state, set)));
        }
        else {
            // We haven't executed any migrations. Do nothing.
            return null;
        }
    }
    private async executeUp(set: MigrationSet) {
        for(const item of set) {
            await item.up(this.client);
            this.storage.setLastRevision(item.title);
            this.emit('up', item);
        }
        this.emit('set.up', set);
    }
    private async executeDown(set: MigrationSet) {
        for(let i = 0; i < set.length; i++) {
            await set[i].down(this.client);
            // For down migrations, we need to set the "last executed" back one further
            // than the "down" migration we just executed.
            this.storage.setLastRevision(set[i + 1] ? set[i + 1].title : null)
            this.emit('down', set[i]);
        }
        this.emit('set.down', set);
    }

    private findPositionInSet(title: string, set: MigrationSet): number {
        const idx = set.findIndex(s => {
            return s.title === title
        })
        if(idx === -1) {
            throw new Error(`Unable to find migration ${title}`)
        }
        return idx
    }
}
