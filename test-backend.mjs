async function test() {
  const res = await fetch('http://localhost:3002/api/health');
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test().catch(console.error);
