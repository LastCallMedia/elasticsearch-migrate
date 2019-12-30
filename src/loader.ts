import {Migration, MigrationSet} from './migration'
import glob from 'glob';
import {promisify} from "util";
import {join} from 'path'
import Maybe = jest.Maybe;

const globp = promisify(glob);

export default class Loader {
    cwd: string
    globs: string[]

    constructor(cwd: string, globs: string|string[]) {
        this.cwd = cwd;
        this.globs = Array.isArray(globs) ? globs : [globs]
    }
    async load(): Promise<MigrationSet> {
        let files : string[] = [];
        for(const glob of this.globs) {
            const part = await globp(glob, {cwd: this.cwd})
            files = files.concat(part)
        }
        const migrations = files
            .map(f => this.attemptLoad(f))
            .sort(this.sort);
        this.assertUnique(migrations);
        return migrations
    }
    private attemptLoad(filename: string): Migration {
        if(!filename.match(/\.(js)/)) {
            throw new Error(`Unable to load migration from ${filename} - this does not look like a JS file.`);
        }
        const prospect = require(join(this.cwd, filename))
        if(!this.isMigration(prospect)) {
            throw new Error(`Unable to load migration from ${filename} - this file needs to export an object with a title, up, and down.`);
        }
        return prospect
    }
    private sort(a: Migration, b: Migration): number {
        return a.title > b.title ? 1 : -1
    }
    private isMigration(prospect: Maybe<Migration>): prospect is Migration {
        if(typeof prospect !== 'object' || prospect === null) {
            return false
        }
        if(!('title' in prospect) || !prospect.title.length) {
            return false
        }
        if(!('up' in prospect) || typeof prospect.up !== 'function') {
            return false;
        }
        if(!('down' in prospect) || typeof prospect.down !== 'function') {
            return false;
        }
        return true
    }
    private assertUnique(migrations: MigrationSet) {
        const seen: {[k: string]: boolean} = {}
        migrations.forEach(function(migration) {
            if(!(migration.title in seen)) {
                seen[migration.title] = true;
            }
            else {
                throw new Error(`Duplicate migration detected: ${migration.title}`)
            }
        })
    }
}
