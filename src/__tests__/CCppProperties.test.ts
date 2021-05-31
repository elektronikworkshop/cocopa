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
import {CCppProperties} from "../CCppProperties";
import {
    CCppPropertiesContent,
    CCppPropertiesMergeMode,
} from "../CCppPropertiesContent";
import {CCppPropertiesContentResult} from "../CCppPropertiesContentResult";
import {
    CCppPropertiesConfiguration,
    CCppPropertiesISMode,
    CCppPropertiesCStandard,
    CCppPropertiesCppStandard,
} from "../CCppPropertiesConfiguration";
import {
    makeRandomString,
    makeRandomStringArray,
    randomEnumItem,
} from "./common";
import {Result} from "../Result";

/**
 *
 * @param name Configuration name
 * @param N Number of configurations to generate
 */
function makeConf(name: string = makeRandomString(), N: number = 1) {
    const r: CCppPropertiesConfiguration[] = [];
    for (let i = 0; i < N; i++) {
        r.push(
            new CCppPropertiesConfiguration(
                makeRandomString(),
                makeRandomStringArray(),
                makeRandomStringArray(),
                makeRandomStringArray(),
                N <= 1 ? name : `${name}-${i}`,
                randomEnumItem(CCppPropertiesISMode),
                randomEnumItem(CCppPropertiesCStandard),
                randomEnumItem(CCppPropertiesCppStandard),
                makeRandomStringArray(),
            ),
        );
    }
    return r;
}

jest.mock("fs");

/**
 *
 */
test(`CCppProperties write`, () => {
    let fileData = "";

    const fsExistsSyncSpy = jest.spyOn(fs, "existsSync").mockReturnValue(false);
    const fsMkdirSyncSpy = jest.spyOn(fs, "mkdirSync").mockReturnValue(undefined);
    const fsWriteFileSyncSpy = jest
        .spyOn(fs, "writeFileSync")
        .mockImplementation(
            (
                path: string | number | Buffer | URL,
                data: any,
                options?: fs.WriteFileOptions,
            ) => {
                fileData = data as string;
            },
        );

    const fakepath = path.join("this path does not exist", "fake.json");

    const p = new CCppProperties();

    // we didn't call read - content must be undefined
    expect(p.content).toBeUndefined();

    // TODO: test multiple configurations
    const result = new Result();
    result.compiler = "g++";
    result.includes = ["/a/b", "/c/d"];
    result.defines = ['MYDEFINE="hello"', "ANOTHER", "CONSTANT=1"];
    result.options = ["-std=gnu++11", "-Wall"];
    result.trash = ["source.ino.cpp", "-o"];
    const pc = new CCppPropertiesContentResult(
        result,
        "test",
        CCppPropertiesISMode.Gcc_X64,
        CCppPropertiesCStandard.C11,
        CCppPropertiesCppStandard.Cpp11,
        ["forced/include"],
    );

    expect(p.changed).toBe(false);

    p.merge(pc, CCppPropertiesMergeMode.ReplaceSameNames);

    expect(p.changed).toBe(true);

    p.write(fakepath);
    expect(p.changed).toBe(false);

    expect(fsExistsSyncSpy).toHaveBeenCalledTimes(1);
    expect(fsExistsSyncSpy).toBeCalledWith(path.dirname(fakepath));

    expect(fsMkdirSyncSpy).toHaveBeenCalledTimes(1);
    expect(fsMkdirSyncSpy).toBeCalledWith(path.dirname(fakepath), {
        recursive: true,
    });

    expect(fsWriteFileSyncSpy).toHaveBeenCalledTimes(1);
    expect(fsWriteFileSyncSpy).toBeCalledWith(fakepath, p.stringyfy());

    const expectedFileContent = {
        version: 4,
        configurations: [
            {
                name: "test",
                compilerPath: "g++",
                compilerArgs: ["-std=gnu++11", "-Wall"],
                intelliSenseMode: "gcc-x64",
                includePath: ["/a/b", "/c/d"],
                forcedInclude: ["forced/include"],
                cStandard: "c11",
                cppStandard: "c++11",
                defines: ['MYDEFINE="hello"', "ANOTHER", "CONSTANT=1"],
            },
        ],
    };
    expect(fileData).toBe(JSON.stringify(expectedFileContent, null, 4));

    fsExistsSyncSpy.mockClear();
    fsMkdirSyncSpy.mockClear();
    fsWriteFileSyncSpy.mockClear();
});

test(`CCppProperties read`, () => {
    const expectedFileContent = {
        version: 4,
        configurations: [
            {
                name: "test",
                compilerPath: "g++",
                compilerArgs: ["-std=gnu++11", "-Wall"],
                intelliSenseMode: "gcc-x64",
                includePath: ["/a/b", "/c/d"],
                forcedInclude: ["forced/include"],
                cStandard: "c11",
                cppStandard: "c++11",
                defines: ['MYDEFINE="hello"', "ANOTHER", "CONSTANT=1"],
            },
        ],
    };
    const fakepath = path.join("this path does not exist", "fake.json");
    const fsReadFileSyncSpy = jest.spyOn(fs, "readFileSync").mockImplementation(
        (
            path: string | number | Buffer | URL,
            options?:
                | string
                | {
                      encoding?: string | null | undefined;
                      flag?: string | undefined;
                  }
                | null
                | undefined,
        ) => {
            expect(path).toBe(fakepath);
            expect(options as string).toBe("utf8");
            return JSON.stringify(expectedFileContent, null, 4) as string;
        },
    );
    const fsExistsSyncSpy = jest.spyOn(fs, "existsSync");
    fsExistsSyncSpy.mockReturnValue(false);

    const p = new CCppProperties();
    expect(p.read(fakepath)).toBe(false);

    fsExistsSyncSpy.mockReturnValue(true);

    expect(p.read(fakepath)).toBe(true);
    if (!p.content) {
        fail("content must exist");
    }
    const e = p.content.equals(expectedFileContent as CCppPropertiesContent);
    expect(e).toBe(true);

    // TODO: test with multiple configurations...
    // TODO: test with corrupt data

    fsReadFileSyncSpy.mockClear();
    fsExistsSyncSpy.mockClear();
});

test(`CCppProperties merge`, () => {
    const p = new CCppProperties();

    // we didn't call read - content must be undefined
    expect(p.content).toBeUndefined();

    ////
    // Test CCppPropertiesMergeMode.Replace

    let original = new CCppPropertiesContent(makeConf("a"));
    let other = new CCppPropertiesContent(makeConf("b"));

    expect(original.equals(other)).toBe(false);

    let res = original.merge(other, CCppPropertiesMergeMode.Replace);

    expect(res).toBe(true);
    expect(original.equals(other)).toBe(true);
    expect(original.configurations[0].name).toBe("b");

    ////
    // Test CCppPropertiesMergeMode.ReplaceSameNames
    //
    // -> configurations with same name will be merged
    // -> if any of the configurations to be merged has no
    //      name set it must be dropped

    // Test, if configuration with empty name will get dropped

    original = new CCppPropertiesContent(makeConf("a"));
    other = new CCppPropertiesContent(makeConf(""));

    expect(original.equals(other)).toBe(false);

    res = original.merge(other, CCppPropertiesMergeMode.ReplaceSameNames);

    expect(res).toBe(false);
    expect(original.equals(other)).toBe(false);

    // Test merging with valid but different name

    other.configurations[0].name = "b";
    res = original.merge(other, CCppPropertiesMergeMode.ReplaceSameNames);
    // we have now two configurations and the second configuration should be
    // the configuration we merged in
    expect(res).toBe(true);
    expect(original.configurations.length).toBe(2);
    expect(original.configurations[1].equals(other.configurations[0])).toBe(
        true,
    );

    // Test merging with valid but same name
    //   since we're using random configurations, the new "b"
    //   must be different than the "b" we created above
    other = new CCppPropertiesContent(makeConf("b"));
    expect(original.configurations[1].equals(other.configurations[0])).toBe(
        false,
    );
    res = original.merge(other, CCppPropertiesMergeMode.ReplaceSameNames);
    expect(res).toBe(true);
    expect(original.configurations[1].equals(other.configurations[0])).toBe(
        true,
    );

    ////
    // TODO: Test CCppPropertiesMergeMode.Complement
    //

    // test if it doesn't modify if source contains empty values
});

test(`CCppProperties confByName`, () => {
    const p = new CCppPropertiesContent(makeConf("my-conf", 3));

    expect(p.confByName("my-conf-X")).toBeUndefined();
    expect(p.confByName("my-conf-2")).toBeDefined();
});

// test "equals" for CCppPropertiesContent and CCppPropertiesConfiguration
