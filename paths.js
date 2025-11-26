import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.dirname(__filename);

function resolveProjectPath(...segments) {
  return path.resolve(projectRoot, ...segments);
}

function fileExists(targetPath) {
  try {
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

const searchDirectories = unique([
  projectRoot,
  path.dirname(projectRoot),
  path.dirname(path.dirname(projectRoot)),
  process.cwd(),
]);

const credentialFileNames = [
  'service-account.json',
  'serviceAccount.json',
  'google-service-account.json',
  'google-credentials.json',
  'credentials.json',
];

const credentialNamePatterns = [
  /^service-?account.*\.json$/i,
  /^google.*credentials.*\.json$/i,
  /^credentials.*\.json$/i,
  /^shopee.*\.json$/i,
];

function tryResolve(candidate) {
  if (!candidate) {
    return null;
  }
  const absolute = path.resolve(candidate);
  return fileExists(absolute) ? absolute : null;
}

function findPatternMatch(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }
      if (credentialNamePatterns.some((pattern) => pattern.test(entry.name))) {
        return path.join(dir, entry.name);
      }
    }
  } catch {
    // Ignore directory read issues
  }
  return null;
}

function findCredentialsFile() {
  const fromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const envCandidate = tryResolve(fromEnv);
  if (envCandidate) {
    return envCandidate;
  }

  for (const dir of searchDirectories) {
    for (const name of credentialFileNames) {
      const candidate = tryResolve(path.join(dir, name));
      if (candidate) {
        return candidate;
      }
    }
  }

  for (const dir of searchDirectories) {
    const patternMatch = tryResolve(findPatternMatch(dir));
    if (patternMatch) {
      return patternMatch;
    }
  }

  // Fallback to default location (may not exist yet)
  return resolveProjectPath('service-account.json');
}

export { projectRoot, resolveProjectPath, findCredentialsFile };


