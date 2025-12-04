import fs from 'fs';
import { resolveProjectPath } from './paths.js';

const DEFAULT_ENV_FILES = ['.env', 'pipeline.env', 'pipeline.env.local', 'pipeline.env.example'];

function parseLine(line) {
  if (!line || line.startsWith('#')) {
    return null;
  }
  const separatorIndex = line.indexOf('=');
  if (separatorIndex === -1) {
    return null;
  }
  const key = line.slice(0, separatorIndex).trim();
  if (!key) {
    return null;
  }
  const rawValue = line.slice(separatorIndex + 1).trim();
  const value = stripWrappingQuotes(rawValue);
  return { key, value };
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function applyEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, 'utf8');
  contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .forEach((line) => {
      const parsed = parseLine(line);
      if (!parsed) {
        return;
      }
      if (Object.prototype.hasOwnProperty.call(process.env, parsed.key)) {
        return;
      }
      process.env[parsed.key] = parsed.value;
    });
}

let loaded = false;

function loadEnv(customFile) {
  if (loaded) {
    return process.env;
  }

  const candidateFiles = [];
  if (customFile) {
    candidateFiles.push(customFile);
  }
  DEFAULT_ENV_FILES.forEach((fileName) => {
    candidateFiles.push(resolveProjectPath(fileName));
  });

  const uniqueFiles = [...new Set(candidateFiles)];
  uniqueFiles.forEach((filePath) => applyEnvFile(filePath));

  loaded = true;
  return process.env;
}

export { loadEnv };


