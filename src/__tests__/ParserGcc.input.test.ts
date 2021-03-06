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

import {Runner} from "../Runner";
import {ParserGcc} from "../ParserGcc";
import {stimuliDir, stimulusFor} from "./common";

for (const stimFileName of fs.readdirSync(stimuliDir)) {
    if (!stimFileName.startsWith("in.")) {
        continue;
    }

    // load stimulus
    const stimulus = stimulusFor(stimFileName) as {
        name: string;
        infile: string;
        ccmd: string;
    };

    test(`parsing ${stimulus.name}`, () => {
        // load expected response
        const sfnp = stimFileName.match(/in\.(.+\.json)/);
        if (!sfnp) {
            fail(
                `could not parse stimulus "${stimFileName}" to generate expected response file name`,
            );
        }
        const response = stimulusFor(`out.${sfnp[1]}`) as {
            includes: string[];
            defines: string[];
            options: string[];
            compiler: string;
            trash: string[];
        };

        const matchPattern = [
            // make sure we're running g++
            /(?:^|-)g\+\+\s+/,
            // make sure we're compiling
            /\s+-c\s+/,
            // trigger parser when compiling the main sketch
            `${stimulus.infile}.cpp.o`,
        ];
        const dontMatchPattern = [
            // make sure Arduino's not testing libraries
            /-o\s\/dev\/null/,
        ];
        const trigger = {match: matchPattern, dontmatch: dontMatchPattern};

        const gpp = new ParserGcc(trigger);

        // disable info parser for test bench, since most of the compilers
        // won't be available on the test system
        gpp.infoParser ? (gpp.infoParser.enabled = false) : null;

        const p = new Runner([gpp]);

        p.parse(stimulus.ccmd);

        // a matching vector must result in a result
        if (!p.result) {
            fail("successful parsing must produce a result.");
        } else {
            expect(p.result.compiler).toStrictEqual(response.compiler);
            expect(p.result.includes).toStrictEqual(response.includes);
            expect(p.result.defines).toStrictEqual(response.defines);
            expect(p.result.options).toStrictEqual(response.options);
            expect(p.result.trash).toStrictEqual(response.trash);
        }

        // test result...

        // test parser reset
        p.reset();
        expect(p.result).toBeUndefined();
    });
} /* files */

// TODO: test compiler built-in extraction separately
// since not everybody has the exact same compiler on its system
// even on my system this will break as soon as arduino board
// packages update.
// Use generic gcc instead and test if it generates a valid list

// test call back variant
// test call back variant
// test for ignores
// test enabling/disabling info parser
