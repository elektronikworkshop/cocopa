/* CoCoPa - Compiler Command Parser, a Parser to extract include directories,
 * defines, arguments and more from compiler command line invocations.
 *
 * Copyright (C) 2020 Uli Franke - Elektronik Workshop
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */
import * as os from "os";
import * as cp from "child_process";

import {BuiltInInfoParser, IBuiltInInfo} from "./BuiltInInfoParser";
import {ResultCppStandard} from "./Result";
import {lineSplitRegEx} from "./helpers";

export enum GccGetBuiltIn {
    Includes = "",
    Defines = "-dM",
}

export function gccGetBuiltInCmd(exe: string, cppStandard: ResultCppStandard,
                                 what: GccGetBuiltIn) {
    const std = cppStandard != ResultCppStandard.None ? `-std=${cppStandard}` :
        "";
    return os.platform() === "win32"
        ? // changing to codepage 65001 (utf8 on Windoze)
          `chcp 65001>nul && "${exe}" -xc++ ${std} ${what} -E -v - < nul 2>&1`
        : `bash -c "\\"${exe}\\" -xc++ ${std} ${what} -E -v - < /dev/null 2>&1"`;
}

/**
 * This functions tries to retrieve either the built in includes or the built
 * in defines from a gcc-type compiler.
 * It has been designed to work on UNIX and Windows systems whereas latter is
 * a bit of a PITA. Getting this to work with "spawn" on it was virtually
 * impossible -- how Windows handles quoting when running cmd as child process
 * is ridiculous. To illustrate this: This following command works within
 * windows' command prompt (cmd) window:
 *
 *   cmd /c chcp 65001 && "C:\\Program Files (x86)\\<..>\\avr/bin/avr-g++" -xc++ -E -v - < nul 2>&1
 *
 *  but not when when passing it to spawn like this:
 *
 *   spawnSync("cmd", "/c", 'chcp 65001 && "C:\\Program Files (x86)\\<..>\\avr/bin/avr-g++" -xc++ -E -v - < nul 2>&1');
 *
 * Therefore I had to resort to exec as done below. The problem I see here is
 * that Windows could potentially be misconfigured such that exec doesn't uses
 * 'cmd' as its default interpreter - a case the code below would fail then.
 *
 * @see https://stackoverflow.com/a/6666338
 * @see https://support.microsoft.com/en-us/help/110930/redirecting-error-messages-from-command-prompt-stderr-stdout
 */
export function gccGetBuiltIn(exe: string, cppStandard: ResultCppStandard,
                              what: GccGetBuiltIn) {
    try {
        return cp.execSync(gccGetBuiltInCmd(exe, cppStandard, what),
                           {encoding: "utf8"});
    } catch (e) {
        return undefined;
    }
}

/**
 * Implementation of BuiltInInfoParser for gcc-like compilers.
 */
export class BuiltInInfoParserGcc extends BuiltInInfoParser {
    public info(exe: string,
                cppStandard: ResultCppStandard): IBuiltInInfo | undefined {
        return {
            includes: this._includes(exe, cppStandard),
            defines: this._defines(exe, cppStandard),
        };
    }
    /**
     * Tries to retrieve the compiler's built in include paths.
     * @param exe Path to compiler executable.
     */
    private _includes(exe: string, cppStandard: ResultCppStandard): string[] {
        const stdout = gccGetBuiltIn(exe, cppStandard, GccGetBuiltIn.Includes);
        if (!stdout) {
            return [];
        }

        // Now we look for
        //
        //   #include "..." search starts here:
        //   #include <...> search starts here:
        //      ...(include directories list)...
        //   End of search list.
        //
        // and extract the include directory list. Could be that some gcc
        // even lists something under
        //
        //   #include "..." search starts here:
        //
        // but I havn't seen it so far.
        const includeregex = /^#include\s+<\.\.\.>\ssearch\sstarts\shere\:$(.+)^End\sof\ssearch\slist\.$/ms;

        const match = stdout.match(includeregex);
        if (!match) {
            return [];
        }

        // Split list by newlines. Should be platform independent
        let lines = match[1].split(lineSplitRegEx());

        // Filter out empty elements (in most cases only the last element)
        lines = lines.filter((v: string) => {
            return v !== "";
        });

        return lines;
    }
    /**
     * Tries to retrieve the compiler's built in defines.
     * @param exe Path to compiler executable.
     */
    private _defines(exe: string, cppStandard: ResultCppStandard): string[] {
        const stdout = gccGetBuiltIn(exe, cppStandard, GccGetBuiltIn.Defines);
        if (!stdout) {
            return [];
        }

        // Now we look for defines in the form of
        //
        // #define __ABCD
        // #define __SSE_MATH__ 1
        // #define __SIZEOF_LONG_LONG__ 8
        // #define __UINT32_T unsigned long
        // #define __FLT128_DECIMAL_DIG__ 36

        const defineregex = /#define\s+(\S+)(?:\s*(.+)|\s*?)/;
        const defines: string[] = [];

        for (const line of stdout.split(lineSplitRegEx())) {
            const match = defineregex.exec(line);
            if (match) {
                // Note: optional capturing groups will be always
                // present in match but undefined if they didn't match
                if (match[2]) {
                    defines.push(`${match[1]}=${match[2]}`);
                } else if (match[1]) {
                    defines.push(match[1]);
                }
            }
        }

        return defines;
    }
}
