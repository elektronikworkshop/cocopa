/* CoCoPa - Compiler Command Parser, a Parser to extract include directories,
 * defines, arguments and more from compiler command line invocations.
 *
 * Copyright (C) 2020 Uli Franke - Elektronik Workshop
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */
import {arraysEqual} from "./helpers";

export enum CCppPropertiesISMode {
    None = "",
    Gcc_X64 = "gcc-x64",
    CLang_X64 = "clang-x64",
    MSVC_X64 = "msvc-x64",
}

export enum CCppPropertiesCStandard {
    None = "",
    C99 = "c99",
    C11 = "c11",
    C18 = "c18",
}

export enum CCppPropertiesCppStandard {
    None = "",
    Cpp98 = "c++98",
    Cpp11 = "c++11",
    Cpp14 = "c++14",
    Cpp17 = "c++17",
    Cpp20 = "c++20",
}

/**
 * Base class representing sub content of the IntelliSense
 * c_cpp_properties.json configuration file.
 *
 * @see https://code.visualstudio.com/docs/cpp/c-cpp-properties-schema-reference
 *
 * **NOTE**:
 *
 *  > Do not add members other than outlined for configurations.
 *  > Member names must not be changed since they represent JSON field names
 */
export class CCppPropertiesConfiguration {
    name: string;
    compilerPath: string;
    compilerArgs: string[];
    intelliSenseMode: string;
    includePath: string[];
    forcedInclude: string[];
    cStandard: string;
    cppStandard: string;
    defines: string[];

    constructor(
        compilerPath: string = "",
        compilerArgs: string[] = [],
        includePath: string[] = [],
        defines: string[] = [],
        name: string = "",
        isMode: CCppPropertiesISMode = CCppPropertiesISMode.None,
        cStandard: CCppPropertiesCStandard = CCppPropertiesCStandard.None,
        cppStandard: CCppPropertiesCppStandard = CCppPropertiesCppStandard.None,
        forcedInclude: string[] = [],
    ) {
        this.name = name;
        this.compilerPath = compilerPath;
        this.compilerArgs = compilerArgs;
        this.intelliSenseMode = isMode;
        this.includePath = includePath;
        this.forcedInclude = forcedInclude;
        this.cStandard = cStandard;
        this.cppStandard = cppStandard;
        this.defines = defines;
    }
    // TODO: check type?
    public copyInto(other: CCppPropertiesConfiguration) {
        this.name = other.name ? other.name : "";
        this.compilerPath = other.compilerPath ? other.compilerPath : "";
        this.compilerArgs = other.compilerArgs ? other.compilerArgs : [];
        this.intelliSenseMode = other.intelliSenseMode
            ? other.intelliSenseMode
            : "";
        this.includePath = other.includePath ? other.includePath : [];
        this.forcedInclude = other.forcedInclude ? other.forcedInclude : [];
        this.cStandard = other.cStandard ? other.cStandard : "";
        this.cppStandard = other.cppStandard ? other.cppStandard : "";
        this.defines = other.defines ? other.defines : [];
    }
    public equals(rhs: CCppPropertiesConfiguration) {
        return (
            this.name === rhs.name &&
            this.compilerPath === rhs.compilerPath &&
            arraysEqual(this.compilerArgs, rhs.compilerArgs) &&
            this.intelliSenseMode === rhs.intelliSenseMode &&
            arraysEqual(this.includePath, rhs.includePath) &&
            arraysEqual(this.forcedInclude, rhs.forcedInclude) &&
            this.cStandard === rhs.cStandard &&
            this.cppStandard === rhs.cppStandard &&
            arraysEqual(this.defines, rhs.defines)
        );
    }
}
