import path from "path";
import * as os from "os";
import * as fs from "fs";
import {Adapter, getAdapters} from "./adapters/index.js";
import {Logger, pino} from "pino";

export type ConfigFile = {
	client: {
		id: string,
		secret: string
	}
}

export type AccessTokenFile = {
	accessToken: string,
	refreshToken: string,
	expiresAt: number
}

const ACCESS_TOKEN_FILE_INITIAL: AccessTokenFile = {
	accessToken: "",
	refreshToken: "",
	expiresAt: 0
}


const CONFIG_FILE_INITIAL: ConfigFile = {
	client: {
		id: "PLACE_HERE_CLIENT_ID",
		secret: "PLACE_HERE_CLIENT_SECRET"
	}
}

export class Globals {
	private static customStoragePath?: string;
	private static _adapters: Adapter[] = []
	private static _debug = false
	private static _logger: Logger

	static accessTokenPath(): string {
		return path.join(Globals.storagePath(), "access-token.json");
	}

	static configPath(): string {
		return path.join(Globals.storagePath(), "config.json");
	}

	static persistPath(): string {
		return path.join(Globals.storagePath(), "persist");
	}

	static storagePath(): string {
		return Globals.customStoragePath ? Globals.customStoragePath : path.join(os.homedir(), ".yandex-homekit");
	}

	static debug(): boolean {
		return Globals._debug
	}

	static setDebug(value: boolean) {
		Globals._debug = value
	}

	private static initLogger() {
		this._logger = pino({
			transport: {
				target: 'pino-pretty',
				options: {
					colorize: true
				}
			},
			level: this._debug ? "trace" : "info"
		})
	}
	public static getLogger() {
		if (!this._logger) this.initLogger()
		return this._logger
	}

	public static setStoragePath(...storagePathSegments: string[]): void {
		Globals.customStoragePath = path.resolve(...storagePathSegments);
	}

	public static getConfig(): ConfigFile {
		if (!fs.existsSync(this.configPath())) {

			fs.writeFileSync(
				this.configPath(),
				Buffer.from(JSON.stringify(CONFIG_FILE_INITIAL, null, 2), "utf-8")
			)
		}

		return JSON.parse(fs.readFileSync(this.configPath()).toString("utf-8"))
	}

	public static getOauth(): AccessTokenFile {
		if (!fs.existsSync(this.accessTokenPath())) {
			this.updateOauth(ACCESS_TOKEN_FILE_INITIAL)
		}

		return JSON.parse(fs.readFileSync(this.accessTokenPath()).toString("utf-8"))
	}

	public static updateOauth(newFile: AccessTokenFile): void {
		fs.writeFileSync(
			this.accessTokenPath(),
			Buffer.from(JSON.stringify(newFile), "utf-8")
		)
	}

	static async loadAdapters() {
		//@ts-ignore
		this._adapters = (await getAdapters()).map((AdapterClass) => new AdapterClass())
	}

	static get adapters() {
		return this._adapters
	}
}