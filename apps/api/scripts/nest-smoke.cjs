try {
  const { NestFactory } = require('@nestjs/core');
  console.log(typeof NestFactory);
} catch (err) {
  console.error(err);
  process.exit(1);
}
