/* CoCoPa - Compiler Command Parser, a Parser to extract include directories,
 * defines, arguments and more from compiler command line invocations.
 *
 * Copyright (C) 2020 Uli Franke - Elektronik Workshop
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */
import * as shlex from "shlex";

import {Result, ResultCppStandard} from "./Result";
import {Parser} from "./Parser";
import {BuiltInInfoParserGcc} from "./BuiltInInfoParserGcc";
import {IParserTrigger} from "./helpers";

/**
 *  Compiler command parsing engine for gcc compilers.
 */
export class ParserGcc extends Parser {
    constructor(trigger: IParserTrigger) {
        super(trigger, new BuiltInInfoParserGcc());
    }
    protected parse(line: string): Result {
        const result = new Result();

        for (let arg of shlex.split(line)) {
            // drop empty arguments
            if (!arg.length) {
                continue;
            }

            // We currently don't handle this.
            //   -U__STRICT_ANSI__ ?

            // Unpack quoted arguments like the following
            //
            //   "-DMBEDTLS_CONFIG_FILE=\"mbedtls/esp_config.h\""
            //   "-DARDUINO_BOARD=\"ESP32_DEV\""
            //   "-DARDUINO_VARIANT=\"doitESP32devkitV1\""
            //
            const packed = arg.match(/^"(.+)"$/);
            if (packed) {
                arg = packed[1];
                // revert escaped quotes inside the quoted arguments
                arg = arg.replace(/\\"/g, '"');
            }

            // extract defines
            const define = arg.match(/^-D(.+)/);
            if (define) {
                result.defines.push(define[1]);
                continue;
            }

            // extract includes
            const include = arg.match(/^-I(.+)/);
            if (include) {
                result.includes.push(include[1]);
                continue;
            }

            // extract the compiler executable
            const c = arg.match(/(?:^|-)g\+\+$/);
            if (c) {
                result.compiler = arg;
                continue;
            }

            // filter out option trash
            const t = arg.match(/^-o|^-O|^-g|^-c|cpp(?:\.o){0,1}$/);
            if (t) {
                result.trash.push(arg);
                continue;
            }

            // collect options
            const o = arg.match(/^-/);
            if (o) {
                result.options.push(arg);
                continue;
            }

            // collect the rest
            result.trash.push(arg);
        }

        ParserGcc.parseCppStd(result);

        return result;
    }

    /**
     * Regular expression to parse gcc options to find the C++ standard.
     * @see https://gcc.gnu.org/projects/cxx-status.html
     */
    static readonly CppStandardOptionRegex = /^-std=(?:c\+\+|gnu\+\+)([0-9]+)$/;

    /**
     * Tries to extract the C++ standard from gcc compiler options.
     * @param result The compiler options of this result will be
     * searched for a valid C++ standard flag. The C++ standard
     * of this object will be set accordingly.
     */
    public static parseCppStd(result: Result) {
        // Initialize C++ standard from parsed options
        const lut = new Map<string, ResultCppStandard>([
            ["98", ResultCppStandard.Cpp98],
            ["11", ResultCppStandard.Cpp11],
            ["14", ResultCppStandard.Cpp14],
            ["17", ResultCppStandard.Cpp17],
            ["20", ResultCppStandard.Cpp20],
        ]);
        for (const o of result.options) {
            const m = o.match(ParserGcc.CppStandardOptionRegex);
            if (!m) {
                continue;
            }
            const std = lut.get(m[1]);
            if (std) {
                result.cppStandard = std;
            }
        }
    }
}

/*
 * Here's a custom argument splitter but it's susceptible to more complex
 * escapes. It seems to work for Arduino compile commands on windows
 * and UNIX systems. I left it here fore reference.
 *
 *   const split = (str: string) => {
 *       let ret: string[] = [];
 *       const splitregex = /"(?:\\"|[^"])+"|\S+/g;
 *       let match;
 *       while ((match = splitregex.exec(str)) !== null) {
 *           ret.push(match[0]);
 *       }
 *       return ret;
 *   }
 */
