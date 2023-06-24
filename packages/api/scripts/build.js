import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { writeFileSync, mkdirSync, rmSync, cpSync } from "node:fs";

import packagejson from "../package.json" assert { type: "json" };

const buildPath = new URL("../build/", import.meta.url);

rmSync(buildPath, { force: true, recursive: true });
mkdirSync(buildPath);

writeFileSync(
	new URL("package.json", buildPath),
	JSON.stringify(
		{
			name: packagejson.name,
			version: packagejson.version,
			description: packagejson.description,
			contributors: packagejson.contributors,
			main: packagejson.main.replace("build/", ""),
			engines: packagejson.engines,
			scripts: {
				start: "node .",
				prestart: "./scripts/setup-keys.sh && ./scripts/setup-db.sh",
			},
			dependencies: packagejson.dependencies,
		},
		null,
		2,
	),
);

cpSync(new URL("../public/", import.meta.url), buildPath, { recursive: true });

esbuild
	.build({
		entryPoints: [new URL("../src/server.ts", import.meta.url).pathname],
		outfile: new URL("server.js", buildPath).pathname,
		bundle: true,
		minify: true,
		platform: "node",
		target: "node16",
		plugins: [nodeExternalsPlugin()],
	})
	.catch(() => process.exit(1));
