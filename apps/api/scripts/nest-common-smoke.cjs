try {
  console.log('before');
  require('@nestjs/common');
  console.log('nest-common-loaded');
} catch (err) {
  console.error(err);
  process.exit(1);
}
