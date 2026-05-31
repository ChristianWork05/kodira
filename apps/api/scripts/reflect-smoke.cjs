try {
  require('reflect-metadata');
  console.log('reflect-loaded');
} catch (err) {
  console.error(err);
  process.exit(1);
}
