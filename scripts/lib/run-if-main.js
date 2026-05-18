import { pathToFileURL } from 'url';

/**
 * Run `main()` when the caller module is executed directly (node scripts/foo.js).
 * Pass the caller's `import.meta.url` as the second argument.
 */
export function runIfMain(main, moduleUrl) {
  const invoked = process.argv[1];
  if (!invoked || !moduleUrl) return;
  if (moduleUrl !== pathToFileURL(invoked).href) return;
  Promise.resolve(main()).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
