try {
  require('mongoose');
  console.log('mongoose-loaded');
} catch (err) {
  console.error(err);
  process.exit(1);
}
