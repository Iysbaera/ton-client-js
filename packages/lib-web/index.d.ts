/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */

interface BinaryLibrary {
    setResponseHandler(
        handler?: (
            requestId: number,
            paramsJson: string,
            responseType: number,
            finished: boolean,
        ) => void,
    ): void,

    createContext(configJson: string): Promise<string>,

    destroyContext(context: number): void,

    sendRequest(
        context: number,
        requestId: number,
        functionName: string,
        functionParamsJson: string,
    ): void,
}

type LibWebOptions = {
    /**
     * Prints debug message.
     * @param message
     */
    debugLog?: (message: any) => void,
    /**
     * URL to `tonclient.wasm` module.
     * Default is "/tonclient.wasm"
     */
    binaryURL?: string,
    /**
     * Alternative WASM module loader.
     */
    loadModule?: () => Promise<WebAssembly.Module>,
}

export declare function libWebSetup(libOptions?: LibWebOptions): void;

export declare function libWeb(): Promise<BinaryLibrary>;
