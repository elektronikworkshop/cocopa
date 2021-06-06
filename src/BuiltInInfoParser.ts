/* CoCoPa - Compiler Command Parser, a Parser to extract include directories,
 * defines, arguments and more from compiler command line invocations.
 *
 * Copyright (C) 2020 Uli Franke - Elektronik Workshop
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */
/**
 * Return value of any BuiltInInfoParser.
 * Contains the includes and other data which are intrinsically
 * known to the compiler without having to specify them explicitly
 * as includes etc. on the command line.
 */
export interface IBuiltInInfo {
    includes: string[];
    defines: string[];
}

/**
 * Classes of this type query compilers about their built-in
 * include paths, defines and so on.
 */
export abstract class BuiltInInfoParser {
    private _enabled: boolean = true;

    public set enabled(e: boolean) {
        this._enabled = e;
    }
    public get enabled() {
        return this._enabled;
    }

    public abstract info(executable: string, options?: string[]): IBuiltInInfo | undefined;
}
