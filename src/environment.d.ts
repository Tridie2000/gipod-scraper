/* eslint-disable unicorn/prevent-abbreviations */
// noinspection JSUnusedGlobalSymbols

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MAPBOX_TOKEN: string;
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
    }
  }
}

export {};
