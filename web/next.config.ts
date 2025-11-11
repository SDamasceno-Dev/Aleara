import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: "/:all*(svg|jpg|jpeg|png|gif|webp|avif)",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=31536000, immutable" },
				],
			},
			{
				// Next static assets
				source: "/_next/static/:path*",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=31536000, immutable" },
				],
			},
		];
	},
	// Dev UX
	reactStrictMode: true,
	webpack(config) {
		// 1) Importing SVG as file-url: `import logoUrl from './logo.svg?url'`
		config.module.rules.push({
			test: /\.svg$/i,
			resourceQuery: /url/, // *.svg?url
			type: "asset/resource",
		});
		// 2) Importing SVG as React component via SVGR
		config.module.rules.push({
			test: /\.svg$/i,
			issuer: /\.[jt]sx?$/,
			resourceQuery: { not: [/url/] },
			use: [
				{
					loader: "@svgr/webpack",
					options: {
						titleProp: true,
						dimensions: false, // size controlled via props/CSS
						svgo: true,
						svgoConfig: {
							plugins: [
								{ name: "removeViewBox", active: false }, // keep viewBox for proper scaling
							],
						},
						svgProps: {
							preserveAspectRatio: "xMidYMid meet",
							className: "block",
						},
					},
				},
			],
		});
		return config;
  },
};

export default nextConfig;
