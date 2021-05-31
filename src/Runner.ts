/* CoCoPa - Compiler Command Parser, a Parser to extract include directories,
 * defines, arguments and more from compiler command line invocations.
 *
 * Copyright (C) 2020 Uli Franke - Elektronik Workshop
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */
import {Result} from "./Result";
import {Parser} from "./Parser";

/**
 * A compiler command parser.
 * Takes compiler commands line by line and tries to find the compile command
 * for the main .ino sketch. From that it tries to extract all includes,
 * defines, options and the compiler command itself.
 */
export class Runner {
    private _engines: Parser[] = [];

    /**
     * Create a compiler command parser.
     * Sets up parsing operation.
     * @param engines Parsing engines for different compilers
     */
    constructor(engines: Parser[]) {
        this._engines = engines;
    }
    /**
     * Returns the parsing result.
     * Returns undefined when the parser fails or when the
     * parser didn't run.
     */
    get result(): Result | undefined {
        // TODO: in case we have multiple matches within multiple
        //   parsers...
        for (const engine of this._engines) {
            if (engine.result) {
                return engine.result;
            }
        }
        return undefined;
    }
    /**
     * Resets all parsers by dropping their result.
     */
    public reset() {
        for (const engine of this._engines) {
            engine.reset();
        }
    }
    /**
     * Takes a command line and tries to parse it.
     *
     * @param line Compiler command line candidate.
     * @returns The parsing result if the command line was parsed
     * successfully. It returns undefined if no match was found or
     * parsing failed.
     */
    public parse(line: string) {
        // TODO: in case we have multiple matches within multiple
        //   parsers...
        for (const engine of this._engines) {
            if (!engine.result) {
                engine.match(line);
            }
        }
    }
    /**
     * Returns a callback which can be passed on to other functions
     * to call. For instance from stdout callbacks of child processes.
     *
     * @param eol line ending pattern, if undefined takes every input as a line.
     */
    public callback(eol?: string): (input: string) => void {
        let last = ""
        return (input: string) => {
            last += input;
            let lines = [last];
            if (eol != null) {
                lines = last.split(eol);
                last = lines.pop()!;
            } else {
                last = "";
            }
            for (const line of lines) {
                this.parse(line);
            }
        };
    }
}
