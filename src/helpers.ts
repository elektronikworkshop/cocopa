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
import * as os from "os";
import * as path from "path";

import Readline from "readline";

/**
 * Escape a string such that it can be used within regular expressions.
 *
 * @param s String to be escaped.
 * @see https://stackoverflow.com/a/3561711
 */
export function regExEscape(s: string) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export function removeDuplicatesFrom<T>(a: T[]) {
    for (let i = 0; i < a.length; ++i) {
        for (let j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j]) a.splice(j--, 1);
        }
    }
    return a;
}

export function arraysEqual<T>(a: T[], b: T[]) {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

export function lineSplitRegEx() {
    return /\s*(?:\r|\r\n|\n)\s*/;
}

/**
 * A trigger is a set of matches and don't-matches which will identify the
 * actual compiler command line the parser then should parse.
 */
export interface IParserTrigger {
    match: (string | RegExp)[];
    dontmatch: (string | RegExp)[];
}

export enum TriggerTarget {
    /** Arduino IDE with gcc based compilers. */
    ArduinoGpp,
}

/**
 * Get a trigger for a specific target.
 * @param target The kind of (development) environment the trigger should be
 * retrieved for.
 * @param platform The platform (OS) this trigger will operate on.
 */
export function getTriggerFor(
    target: TriggerTarget,
    platform?: string,
): IParserTrigger {
    let matchPattern: (string | RegExp)[] = [];
    let dontMatchPattern: (string | RegExp)[] = [];

    if (!platform) {
        platform = os.platform();
    }

    switch (target) {
        case TriggerTarget.ArduinoGpp:
            matchPattern = [
                // make sure we're running g++
                /(?:^|-)g\+\+"{0,1}\s+/,
                // make sure we're compiling
                /\s+-c\s+/,
            ];
            dontMatchPattern =
                platform !== "win32" ? [/-o\s\/dev\/null/] : [/-o\snul/];
            break;
    }

    return {
        match: matchPattern,
        dontmatch: dontMatchPattern,
    };
}

/**
 * Get the trigger for a gcc-based Arduino environment to trigger on the
 * sketch compilation compiler command.
 * @param sketch Path to the sketch to be compiled ('verified' or 'uploaded')
 * @param platform Operating system string as returned by os.platform(). If not
 * provided, it will be retrieved internally.
 */
export function getTriggerForArduinoGcc(sketch: string, platform?: string) {
    // trigger parser when compiling the main sketch
    // /-o\s+"{0,1}(?:\\"|[^"])+\.ino\.cpp\.o"{0,1}/,

    sketch = `-o\\s+"{0,1}?(?:\\"|[^"])*?${regExEscape(
        sketch,
    )}\\.cpp\\.o"{0,1}?`;

    const trigger = getTriggerFor(TriggerTarget.ArduinoGpp, platform);

    trigger.match.push(RegExp(sketch));
    return trigger;
}

export async function fsreaddir(dir: string) {
    return new Promise<string[]>((resolve, reject) => {
        fs.readdir(dir, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

export async function fsstat(entry: string) {
    return new Promise<fs.Stats>((resolve, reject) => {
        fs.stat(entry, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

export function readAtFile(filePath: string): string {
    const file = fs.readFileSync(filePath, "utf8");
    return file;
}

/**
 * Search directories recursively for a file.
 * @param dir Directory where the search should begin.
 * @param what The file we're looking for.
 * @returns The path of the directory which contains the file else undefined.
 */
export async function findFileIn(
    dir: string,
    what: string,
    options?: {stopOnFirst: boolean},
): Promise<string[]> {
    try {
        const result: string[] = [];
        for (const entry of await fsreaddir(dir)) {
            const p = path.join(dir, entry);
            try {
                const s = await fsstat(p);
                if (s.isDirectory()) {
                    result.push(...(await findFileIn(p, what, options)));
                } else if (entry === what) {
                    result.push(dir);
                } else {
                    continue;
                }
                if (options && options.stopOnFirst && result.length >= 1) {
                    return result;
                }
            } catch (e) {
                continue;
            }
        }
        return result;
    } catch (e) {
        return [];
    }
}
