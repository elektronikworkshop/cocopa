/* CoCoPa - Compiler Command Parser, a Parser to extract include directories,
 * defines, arguments and more from compiler command line invocations.
 *
 * Copyright (C) 2020 Uli Franke - Elektronik Workshop
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */
import * as fs from "fs";
import * as path from "path";

import {
    CCppPropertiesContent,
    CCppPropertiesMergeMode,
} from "./CCppPropertiesContent";

export class CCppProperties {
    private _content: CCppPropertiesContent | undefined = undefined;
    private _changed: boolean = false;

    public get content(): CCppPropertiesContent | undefined {
        return this._content;
    }

    public get changed() {
        return this._changed;
    }

    public read(pPath: string) {
        if (!fs.existsSync(pPath)) {
            return false;
        }

        const loadedProps = JSON.parse(
            fs.readFileSync(pPath, "utf8"),
        ) as CCppPropertiesContent;

        if (!loadedProps) {
            return false;
        }

        this._content = new CCppPropertiesContent();
        this._content.copyInto(loadedProps);
        this._changed = false;

        return true;
    }

    public merge(
        properties: CCppPropertiesContent,
        mode: CCppPropertiesMergeMode,
    ) {
        // if no previous properties have been loaded, merging
        // is trivial for all merge modes
        if (!this._content) {
            this._content = properties;
            this._changed = true;
            return true;
        }

        this._changed = this._content.merge(properties, mode);

        return this._changed;
    }

    public write(pPath: string) {
        if (this._content && this._changed) {
            const propFolder = path.dirname(pPath);
            if (!fs.existsSync(propFolder)) {
                fs.mkdirSync(propFolder, {recursive: true});
            }

            fs.writeFileSync(pPath, this.stringyfy());

            this._changed = false;
            return true;
        }
        return false;
    }

    public stringyfy() {
        return JSON.stringify(this._content, null, 4);
    }
}
