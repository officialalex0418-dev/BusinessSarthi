import { spawn } from 'child_process';

const runCommand = (command, args, cwd) => {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd, stdio: 'inherit', shell: true });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command ${command} ${args.join(' ')} failed with code ${code}`));
    });
  });
};

async function runAll() {
  console.log("==========================================");
  console.log("   BUSINESS SARTHI VERIFICATION SUITE");
  console.log("==========================================");

  try {
    console.log("\n[1/3] Running Backend Idempotency Tests...");
    await runCommand('node', ['test-idempotency.js'], './backend');

    console.log("\n[2/3] Running Backend Analytics Tests...");
    await runCommand('node', ['test-analytics.js'], './backend');

    console.log("\n[3/3] Running Frontend Production Build...");
    await runCommand('npm', ['run', 'build'], './frontend');

    console.log("\n==========================================");
    console.log("   ALL TESTS PASSED SUCCESSFULLY! ✅");
    console.log("==========================================");
  } catch (error) {
    console.error("\n❌ VERIFICATION FAILED:", error.message);
    process.exit(1);
  }
}

runAll();