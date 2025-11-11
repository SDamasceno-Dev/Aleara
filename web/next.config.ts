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
};

export default nextConfig;
