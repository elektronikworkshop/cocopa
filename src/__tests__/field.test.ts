/* CoCoPa - Compiler Command Parser, a Parser to extract include directories,
 * defines, arguments and more from compiler command line invocations.
 *
 * Copyright (C) 2020 Uli Franke - Elektronik Workshop
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */
import * as path from "path";
import * as fs from "fs";
import {stimulusRawFor, stimuliDir} from "./common";
import {getTriggerFor, lineSplitRegEx, TriggerTarget} from "../helpers";
import {ParserGcc} from "../ParserGcc";
import {Runner} from "../Runner";
import {fail} from "assert";

const fieldDir = "field";
const platformLinux = "linux";
const platformOsx = "osx";
const platformWin = "win";

for (const file of fs.readdirSync(path.join(stimuliDir, fieldDir))) {
    const stat = fs.lstatSync(path.join(stimuliDir, fieldDir, file));
    if (stat.isDirectory()) {
        continue;
    }

    test(`field data: ${file}`, () => {
        // 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
        let platform: string;

        if (file.startsWith(`${platformLinux}.`)) {
            platform = "linux";
        } else if (file.startsWith(`${platformOsx}.`)) {
            platform = "darwin";
        } else if (file.startsWith(`${platformWin}.`)) {
            platform = "win32";
        } else {
            fail(`unknown test vector ${file}`);
        }

        const stimulus = stimulusRawFor(path.join(fieldDir, file));
        const lines = stimulus.match(/[^]{1,256}/g) ?? [];

        const trigger = getTriggerFor(TriggerTarget.ArduinoGpp, platform);
        const gpp = new ParserGcc(trigger);

        // we can not run foreign compilers here - we could
        // use a mock in the future though
        gpp.infoParser ? (gpp.infoParser.enabled = false) : null;

        const runner = new Runner([gpp]);
        const cb = runner.callback('\n');

        lines.forEach(line => {
            cb(line);
        });

        const result = runner.result;

        if (!result) {
            fail("no compiler invocation found");
        }

        expect(result.includes.length).toBeGreaterThan(0);
        expect(result.defines.length).toBeGreaterThan(0);
        expect(result.options.length).toBeGreaterThan(0);
        expect(result.compiler.length).toBeGreaterThan(0);
    });
}
