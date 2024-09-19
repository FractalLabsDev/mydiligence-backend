type EnvKey = "development" | "local" | "dev" | "stage" | "staging" | "prod" | "production";

export function getEnvironment(): string {
  const matchEnvs = {
    development: "local",
    local: "local",
    dev: "dev",
    stage: "stage",
    staging: "stage",
    prod: "prod",
    production: "prod",
  }

  const key = (process.env.NODE_ENV || "development") as EnvKey;
  return matchEnvs[key];
}
