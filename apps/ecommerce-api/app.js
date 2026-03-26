// apps/ecommerce-api/app.js
export function banner(msg) {
  const line = '─'.repeat(54);
  console.log(`\n┌${line}┐`);
  console.log(`│  🖼️  Ecommerce Cuadros API                          │`);
  console.log(`│  ${msg.padEnd(52)}│`);
  console.log(`└${line}┘\n`);
}

export function ok(msg) {
  console.log(`[✓] ${msg}`);
}
