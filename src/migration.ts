import {Client as ElasticsearchClient} from "@elastic/elasticsearch";

export type Migration = {
    title: string
    up: (client: ElasticsearchClient) => Promise<void>
    down: (client: ElasticsearchClient) => Promise<void>
}

export type MigrationSet = Migration[]
