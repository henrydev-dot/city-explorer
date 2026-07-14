// Re-export the Monaco catalog. The implementation lives in catalog.mjs so
// that Node scripts (hardhat seeding, tooling) can import the exact same
// 49-unit catalog the frontend uses, without a bundler.
export * from './catalog.mjs';
export { default } from './catalog.mjs';
