export function getAppVersion(): { version: string; rev?: string } {
  const version =
    process.env.VERCEL_GIT_TAG ||
    process.env.npm_package_version ||
    process.env.NEXT_PUBLIC_APP_VERSION ||
    '';
  const rev = process.env.VERCEL_GIT_COMMIT_SHA
    ? String(process.env.VERCEL_GIT_COMMIT_SHA).slice(0, 7)
    : undefined;
  return { version, rev };
}
