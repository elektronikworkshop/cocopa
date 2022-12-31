/* CoCoPa - Compiler Command Parser, a Parser to extract include directories,
 * defines, arguments and more from compiler command line invocations.
 *
 * Copyright (C) 2020 Uli Franke - Elektronik Workshop
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */
import {Result, ResultCppStandard} from "../Result";
import {ParserGcc} from "../ParserGcc";

const tests: {options: string[]; std: ResultCppStandard}[] = [
    {
        options: ["-std=c++98"],
        std: ResultCppStandard.Cpp98,
    },
    {
        options: ["-std=c++11"],
        std: ResultCppStandard.Cpp11,
    },
    {
        options: ["-std=c++14"],
        std: ResultCppStandard.Cpp14,
    },
    {
        options: ["-std=c++17"],
        std: ResultCppStandard.Cpp17,
    },
    {
        options: ["-std=c++20"],
        std: ResultCppStandard.Cpp20,
    },
    {
        options: ["-std=gnu++98"],
        std: ResultCppStandard.Cpp98,
    },
    {
        options: ["-std=gnu++11"],
        std: ResultCppStandard.Cpp11,
    },
    {
        options: ["-std=gnu++14"],
        std: ResultCppStandard.Cpp14,
    },
    {
        options: ["-std=gnu++17"],
        std: ResultCppStandard.Cpp17,
    },
    {
        options: ["-std=gnu++20"],
        std: ResultCppStandard.Cpp20,
    },
    {
        options: ["-std=bla++14"],
        std: ResultCppStandard.None,
    },
    {
        options: ["-Wall"],
        std: ResultCppStandard.None,
    },
    {
        options: [],
        std: ResultCppStandard.None,
    },
    {
        options: ["std=gnu++11", "-std=gnu++20"],
        std: ResultCppStandard.Cpp20,
    },
];

for (const t of tests) {
    const name = t.options.length ? t.options[0] : "[]";
    test(`ResultGcc.init ${name}`, () => {
        const r = new Result();
        r.options = t.options;
        ParserGcc.parseCppStd(r);
        expect(r.cppStandard).toBe(t.std);
    });
}
