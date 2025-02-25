import {TonClient} from "@tonclient/core";
import {
    Abi, accountForExecutorAccount,
    ParamsOfEncodeMessage,
    ResultOfProcessMessage,
    ResultOfRunExecutor,
    Signer,
} from "@tonclient/core";

export type AccountDeployParams = {
    tvc: string, initFunctionName?: string,
    initFunctionInput?: any,
    initData?: any,
}

export class AccountError extends Error {
}

export class Account {
    readonly client: TonClient;
    readonly abi: Abi;
    readonly signer: Signer;

    private readonly deployParams: AccountDeployParams | null;
    private address: string | null;
    private cachedBoc: string | null;

    // private cachedParsed: any | null;

    constructor(
        client: TonClient,
        abi: Abi,
        signer: Signer,
        addressOrDeploy: string | AccountDeployParams,
    ) {
        this.client = client;
        this.abi = abi;
        this.signer = signer;
        if (typeof addressOrDeploy === "string") {
            this.address = addressOrDeploy;
            this.deployParams = null;
        } else {
            this.address = null;
            this.deployParams = addressOrDeploy;
        }
        this.cachedBoc = null;
    }

    async getAddress(): Promise<string> {
        let address = this.address;
        if (!address) {
            const deployParams = this.getParamsOfDeployMessage();
            address = (await this.client.abi.encode_message(deployParams)).address;
            this.address = address;
        }
        return address;
    }

    getParamsOfDeployMessage(): ParamsOfEncodeMessage {
        const params = this.deployParams;
        if (!params) {
            throw this.errorDeployParamsRequired();
        }
        return {
            abi: this.abi,
            signer: this.signer,
            deploy_set: {
                tvc: params.tvc,
                initial_data: params.initData,
            },
            call_set: params.initFunctionName
                ? {
                    function_name: params.initFunctionName,
                    input: params.initFunctionInput,
                }
                : undefined,
        };
    }

    async deploy(): Promise<ResultOfProcessMessage> {
        const deployParams = this.getParamsOfDeployMessage();
        this.address = (await this.client.abi.encode_message(deployParams)).address;
        return await this.client.processing.process_message({
            message_encode_params: deployParams,
            send_events: false,
        });
    }

    async run(functionName: string, input?: any): Promise<ResultOfProcessMessage> {
        return await this.client.processing.process_message({
            message_encode_params: {
                address: await this.getAddress(),
                abi: this.abi,
                signer: this.signer,
                call_set: {
                    function_name: functionName,
                    input,
                },
            },
            send_events: false,
        });
    }

    async runLocal(functionName: string, input: any): Promise<ResultOfRunExecutor> {
        const message = await this.client.abi.encode_message({
            abi: this.abi,
            signer: this.signer,
            call_set: {
                function_name: functionName,
                input,
            },
        });
        const result = await this.client.tvm.run_executor({
            account: accountForExecutorAccount(await this.boc()),
            abi: this.abi,
            message: message.message,
        });
        if (result.account) {
            this.cachedBoc = result.account;
        }
        return result;
    }

    dropCachedData() {
        this.cachedBoc = null;
    }

    async boc(): Promise<string> {
        if (this.cachedBoc) {
            return this.cachedBoc;
        }
        const boc = (await this.client.net.wait_for_collection({
            collection: "accounts",
            filter: {id: {eq: this.address}},
            result: "boc",
        })).result.boc;
        this.cachedBoc = boc;
        return boc;
    }

    async getAccount(): Promise<any> {
        return (await this.client.boc.parse_account({
            boc: await this.boc(),
        })).parsed;
    }

    private errorDeployParamsRequired(): AccountError {
        return new AccountError(`Deploy params required. `);
    }
}
