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
import {ParserGcc} from "../ParserGcc";
import {ResultCppStandard} from "../Result";
import {makeExecSyncSpy} from "./mocks";
import {gccGetBuiltInCmd, GccGetBuiltIn} from "../BuiltInInfoParserGcc";

jest.mock("child_process");
jest.mock("os");

for (const platform of ["win32", "darwin", "linux"]) {
    test(`compiler built-in info parser on ${platform}`, () => {
        const exe = "mock-g++";

        const osPlatformSpy = jest
            .spyOn(os, "platform")
            .mockReturnValue(platform as NodeJS.Platform);

        const execSyncSpy = makeExecSyncSpy([
            {
                file: "gpp.amd64.builtin.includes.stimulus.txt",
                pattern: gccGetBuiltInCmd(exe, ResultCppStandard.None,
                                          GccGetBuiltIn.Includes),
            },
            {
                file: "gpp.amd64.builtin.defines.stimulus.txt",
                pattern: gccGetBuiltInCmd(exe, ResultCppStandard.None,
                                          GccGetBuiltIn.Defines),
            },
        ]);

        const testFile = "test.cpp";
        const cmd = `${exe} -c -o ${testFile}.o ${testFile}`;

        const trigger = {
            match: [
                // make sure we're running g++
                /(?:^|-)g\+\+\s+/,
                // make sure we're compiling
                /\s+-c\s+/,
                // user defined match pattern
                `${testFile}.o`,
            ],
            dontmatch: [],
        };
        const p = new ParserGcc(trigger);

        expect(p.infoParser).toBeDefined();

        p.match(cmd);

        if (!p.result) {
            fail("compiler command line did not trigger");
        }

        // Manually extracted includes and defines from stimulus
        const includes = [
            "/usr/include/c++/7",
            "/usr/include/x86_64-linux-gnu/c++/7",
            "/usr/include/c++/7/backward",
            "/usr/lib/gcc/x86_64-linux-gnu/7/include",
            "/usr/local/include",
            "/usr/lib/gcc/x86_64-linux-gnu/7/include-fixed",
            "/usr/include/x86_64-linux-gnu",
            "/usr/include",
        ];
        const defines = [
            "__DBL_MIN_EXP__=(-1021)",
            "__MY_TYPE=unsigned long long",
            "__FLT32X_MAX_EXP__=1024",
            "__cpp_attributes=200809",
            "__UINT_LEAST16_MAX__=0xffff",
            "__ATOMIC_ACQUIRE=2",
            "__FLT128_MAX_10_EXP__=4932",
            "PLAIN_DEFINE",
            "PLAIN_DEFINE_SPACE",
            "LAST_DEFINE_NO_EOL=3",
        ];
        expect(p.result.compiler).toStrictEqual("mock-g++");
        expect(p.result.trash).toStrictEqual([
            "-c",
            "-o",
            `${testFile}.o`,
            testFile,
        ]);
        expect(p.result.includes).toStrictEqual(includes);
        expect(p.result.defines).toStrictEqual(defines);

        // once for include, once for defines
        expect(execSyncSpy).toHaveBeenCalledTimes(2);

        osPlatformSpy.mockClear();
        execSyncSpy.mockClear();
    });
}
