try {
  require('express');
  console.log('express-loaded');
} catch (err) {
  console.error(err);
  process.exit(1);
}
