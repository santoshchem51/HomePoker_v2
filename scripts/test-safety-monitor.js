#!/usr/bin/env node
/**
 * Test Safety Monitor - Monitors parallel test execution for safety issues
 * Usage: node scripts/test-safety-monitor.js [--watch]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

class TestSafetyMonitor {
  constructor(options = {}) {
    this.watchMode = options.watch || false;
    this.tempDir = path.join(__dirname, '..', 'temp');
    this.lockFile = path.join(this.tempDir, 'parallel-test.lock');
    this.monitoring = false;
    this.alerts = [];
  }

  start() {
    console.log('🛡️  Test Safety Monitor starting...');
    
    if (this.watchMode) {
      console.log('👀 Watch mode enabled - monitoring continuously');
      this.monitoring = true;
      this.monitorLoop();
    } else {
      this.checkOnce();
    }
  }

  async monitorLoop() {
    while (this.monitoring) {
      await this.checkSafety();
      await this.sleep(5000); // Check every 5 seconds
    }
  }

  async checkOnce() {
    await this.checkSafety();
    this.printSummary();
  }

  async checkSafety() {
    const timestamp = new Date().toISOString();
    const checks = {
      timestamp,
      lockFile: this.checkLockFile(),
      resources: this.checkSystemResources(),
      orphanedProcesses: await this.checkOrphanedProcesses(),
      tempFiles: this.checkTempFiles(),
      zombieWorkers: this.checkZombieWorkers()
    };

    this.evaluateChecks(checks);
    
    if (this.watchMode) {
      this.printWatchStatus(checks);
    }

    return checks;
  }

  checkLockFile() {
    try {
      if (!fs.existsSync(this.lockFile)) {
        return { status: 'ok', message: 'No active test lock' };
      }

      const lockData = JSON.parse(fs.readFileSync(this.lockFile, 'utf8'));
      const lockAge = Date.now() - new Date(lockData.startTime).getTime();
      
      if (lockAge > 30 * 60 * 1000) { // 30 minutes
        return { 
          status: 'warning', 
          message: `Lock file is ${Math.round(lockAge / 60000)} minutes old`,
          action: 'Consider checking if tests are stuck'
        };
      }

      return { 
        status: 'info', 
        message: `Tests running (PID: ${lockData.pid})` 
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: `Lock file corrupted: ${error.message}` 
      };
    }
  }

  checkSystemResources() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemoryPercent = ((totalMemory - freeMemory) / totalMemory) * 100;
    const loadAverage = os.loadavg()[0];
    const cpuCount = os.cpus().length;

    const alerts = [];
    
    if (usedMemoryPercent > 90) {
      alerts.push({ level: 'critical', message: `Memory usage: ${usedMemoryPercent.toFixed(1)}%` });
    } else if (usedMemoryPercent > 80) {
      alerts.push({ level: 'warning', message: `Memory usage: ${usedMemoryPercent.toFixed(1)}%` });
    }

    if (loadAverage > cpuCount * 2) {
      alerts.push({ level: 'warning', message: `High CPU load: ${loadAverage.toFixed(2)}` });
    }

    return {
      status: alerts.length > 0 ? 'warning' : 'ok',
      memory: usedMemoryPercent,
      cpu: loadAverage,
      alerts
    };
  }

  async checkOrphanedProcesses() {
    try {
      // Check for hanging Node processes that might be test workers
      const result = await this.execCommand('pgrep -f "jest.*worker"');
      const processes = result.split('\n').filter(Boolean);
      
      if (processes.length > 10) {
        return {
          status: 'warning',
          message: `${processes.length} jest worker processes found`,
          action: 'Consider killing orphaned processes'
        };
      }

      return { status: 'ok', processes: processes.length };
    } catch (error) {
      return { status: 'ok', message: 'No orphaned processes detected' };
    }
  }

  checkTempFiles() {
    try {
      if (!fs.existsSync(this.tempDir)) {
        return { status: 'ok', message: 'No temp directory' };
      }

      const files = fs.readdirSync(this.tempDir);
      const totalSize = files.reduce((size, file) => {
        try {
          const filePath = path.join(this.tempDir, file);
          return size + fs.statSync(filePath).size;
        } catch (error) {
          return size;
        }
      }, 0);

      const sizeInMB = totalSize / (1024 * 1024);
      
      if (sizeInMB > 100) {
        return {
          status: 'warning',
          message: `Temp files: ${sizeInMB.toFixed(1)}MB`,
          action: 'Consider cleaning up temp files'
        };
      }

      return { status: 'ok', files: files.length, sizeInMB: sizeInMB.toFixed(1) };
    } catch (error) {
      return { status: 'error', message: `Cannot check temp files: ${error.message}` };
    }
  }

  checkZombieWorkers() {
    // Check for worker directories that might indicate crashed workers
    try {
      if (!fs.existsSync(this.tempDir)) {
        return { status: 'ok', message: 'No worker directories' };
      }

      const workerDirs = fs.readdirSync(this.tempDir)
        .filter(name => name.startsWith('worker-'))
        .map(name => {
          const dirPath = path.join(this.tempDir, name);
          const stat = fs.statSync(dirPath);
          return {
            name,
            age: Date.now() - stat.mtime.getTime()
          };
        });

      const staleWorkers = workerDirs.filter(worker => worker.age > 60000); // 1 minute

      if (staleWorkers.length > 0) {
        return {
          status: 'warning',
          message: `${staleWorkers.length} stale worker directories`,
          staleWorkers: staleWorkers.map(w => w.name)
        };
      }

      return { status: 'ok', activeWorkers: workerDirs.length };
    } catch (error) {
      return { status: 'error', message: `Cannot check worker directories: ${error.message}` };
    }
  }

  evaluateChecks(checks) {
    // Count critical issues
    const criticalIssues = Object.values(checks)
      .filter(check => check && check.status === 'error').length;

    const warnings = Object.values(checks)
      .filter(check => check && check.status === 'warning').length;

    if (criticalIssues > 0) {
      this.alerts.push({ level: 'critical', message: `${criticalIssues} critical issues detected` });
    }
    
    if (warnings > 2) {
      this.alerts.push({ level: 'warning', message: `${warnings} warnings detected` });
    }
  }

  printWatchStatus(checks) {
    process.stdout.write('\r\x1b[K'); // Clear line
    
    const status = this.getOverallStatus(checks);
    const statusIcon = status === 'critical' ? '🔴' : status === 'warning' ? '🟡' : '🟢';
    
    process.stdout.write(`${statusIcon} ${new Date().toLocaleTimeString()} | `);
    process.stdout.write(`Memory: ${checks.resources.memory.toFixed(1)}% | `);
    process.stdout.write(`CPU: ${checks.resources.cpu.toFixed(1)} | `);
    process.stdout.write(`Workers: ${checks.zombieWorkers.activeWorkers || 0}`);
  }

  printSummary() {
    console.log('\n📋 Test Safety Summary:');
    console.log('========================');
    
    if (this.alerts.length === 0) {
      console.log('✅ All safety checks passed');
    } else {
      this.alerts.forEach(alert => {
        const icon = alert.level === 'critical' ? '🔴' : '🟡';
        console.log(`${icon} ${alert.message}`);
      });
    }
  }

  getOverallStatus(checks) {
    const statuses = Object.values(checks).map(check => check && check.status).filter(Boolean);
    
    if (statuses.includes('error')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'ok';
  }

  async execCommand(command) {
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command]);
      let stdout = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
    });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.monitoring = false;
    console.log('\n🛑 Safety monitor stopped');
  }
}

// CLI handling
if (require.main === module) {
  const watchMode = process.argv.includes('--watch');
  const monitor = new TestSafetyMonitor({ watch: watchMode });
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });
  
  monitor.start();
}

module.exports = TestSafetyMonitor;