try {
  require('@nestjs/platform-express');
  console.log('platform-express-loaded');
} catch (err) {
  console.error(err);
  process.exit(1);
}
