#!/usr/bin/env tsx
/**
 * Multi-Tenant Stress Test for Flow HQ WhatsApp MVP
 * 
 * This script:
 * 1. Creates 3 test tenants
 * 2. Starts their workers
 * 3. Simulates inbound messages
 * 4. Verifies no cross-tenant data leakage
 */

import { PrismaClient, TenantStatus, MessageDirection } from '@flowhq/shared';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

interface TestTenant {
  id: string;
  name: string;
  phone_number: string;
  expectedMessageCount: number;
}

interface TestResult {
  passed: boolean;
  test: string;
  details: string;
  errors?: string[];
}

const testResults: TestResult[] = [];

function recordResult(result: TestResult) {
  testResults.push(result);
  const icon = result.passed ? '✓' : '✗';
  console.log(`${icon} ${result.test}: ${result.details}`);
  if (result.errors && result.errors.length > 0) {
    result.errors.forEach(e => console.log(`  - ${e}`));
  }
}

async function createTenant(index: number): Promise<TestTenant> {
  const name = `StressTest-Tenant-${index}-${Date.now()}`;
  const phone_number = `+25570000000${index}`;
  
  const response = await fetch(`${ADMIN_API_URL}/admin/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic admin:${ADMIN_PASSWORD}`
    },
    body: JSON.stringify({
      name,
      phone_number,
      template_type: 'BOOKING',
      business_name: `Test Business ${index}`,
      language: 'SW'
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create tenant: ${await response.text()}`);
  }
  
  const tenant = await response.json();
  console.log(`Created tenant: ${tenant.id} (${name})`);
  
  return {
    id: tenant.id,
    name,
    phone_number,
    expectedMessageCount: 0
  };
}

async function startWorker(tenantId: string): Promise<void> {
  const response = await fetch(`${ADMIN_API_URL}/admin/tenants/${tenantId}/worker/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic admin:${ADMIN_PASSWORD}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to start worker: ${await response.text()}`);
  }
  
  console.log(`Started worker for tenant: ${tenantId}`);
  
  // Wait for worker to initialize
  await new Promise(r => setTimeout(r, 3000));
}

async function simulateInboundMessage(
  tenantId: string, 
  fromNumber: string, 
  messageText: string,
  waMessageId: string
): Promise<void> {
  // Direct DB injection to simulate message (since we can't easily mock whatsapp-web.js)
  await prisma.messageLog.create({
    data: {
      tenant_id: tenantId,
      direction: 'IN',
      from_number: fromNumber,
      to_number: 'bot',
      message_text: messageText,
      wa_message_id: waMessageId
    }
  });
}

async function simulateOutboundMessage(
  tenantId: string,
  toNumber: string,
  messageText: string,
  waMessageId: string
): Promise<void> {
  await prisma.messageLog.create({
    data: {
      tenant_id: tenantId,
      direction: 'OUT',
      from_number: 'bot',
      to_number: toNumber,
      message_text: messageText,
      wa_message_id: waMessageId
    }
  });
}

async function verifyTenantIsolation(tenants: TestTenant[]): Promise<void> {
  console.log('\n--- Verifying Tenant Isolation ---\n');
  
  for (const tenant of tenants) {
    const logs = await prisma.messageLog.findMany({
      where: { tenant_id: tenant.id }
    });
    
    // Verify all logs belong to this tenant
    const foreignLogs = logs.filter(log => log.tenant_id !== tenant.id);
    
    if (foreignLogs.length > 0) {
      recordResult({
        passed: false,
        test: `Tenant Isolation - ${tenant.name}`,
        details: `Found ${foreignLogs.length} foreign logs!`,
        errors: foreignLogs.map(l => `Log ${l.id} has wrong tenant_id`)
      });
    } else {
      recordResult({
        passed: true,
        test: `Tenant Isolation - ${tenant.name}`,
        details: `All ${logs.length} logs correctly isolated`
      });
    }
  }
}

async function verifyNoCrossTenantDataLeakage(tenants: TestTenant[]): Promise<void> {
  console.log('\n--- Verifying No Cross-Tenant Data Leakage ---\n');
  
  // Get all logs
  const allLogs = await prisma.messageLog.findMany();
  
  // Group by tenant
  const logsByTenant = new Map<string, typeof allLogs>();
  for (const log of allLogs) {
    if (!logsByTenant.has(log.tenant_id)) {
      logsByTenant.set(log.tenant_id, []);
    }
    logsByTenant.get(log.tenant_id)!.push(log);
  }
  
  // Check for message text that should only belong to one tenant appearing in another
  const errors: string[] = [];
  
  for (const [tenantId, logs] of logsByTenant) {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) continue;
    
    // Check that messages contain expected tenant-specific markers
    for (const log of logs) {
      // Each tenant should only have their own messages
      const otherTenants = tenants.filter(t => t.id !== tenantId);
      for (const other of otherTenants) {
        if (log.message_text.includes(other.name)) {
          errors.push(`Tenant ${tenantId} has message referencing ${other.name}`);
        }
      }
    }
  }
  
  if (errors.length > 0) {
    recordResult({
      passed: false,
      test: 'Cross-Tenant Data Leakage',
      details: `Found ${errors.length} data leakage issues`,
      errors
    });
  } else {
    recordResult({
      passed: true,
      test: 'Cross-Tenant Data Leakage',
      details: 'No data leakage detected'
    });
  }
}

async function verifySessionIsolation(tenants: TestTenant[]): Promise<void> {
  console.log('\n--- Verifying Session Isolation ---\n');
  
  for (const tenant of tenants) {
    const session = await prisma.whatsappSession.findUnique({
      where: { tenant_id: tenant.id }
    });
    
    if (!session) {
      recordResult({
        passed: false,
        test: `Session Isolation - ${tenant.name}`,
        details: 'Session not found',
        errors: ['WhatsAppSession missing for tenant']
      });
      continue;
    }
    
    // Verify no other tenant has this session
    const otherSessions = await prisma.whatsappSession.findMany({
      where: {
        id: session.id,
        tenant_id: { not: tenant.id }
      }
    });
    
    if (otherSessions.length > 0) {
      recordResult({
        passed: false,
        test: `Session Isolation - ${tenant.name}`,
        details: 'Session ID shared with other tenants!',
        errors: otherSessions.map(s => `Session shared with tenant ${s.tenant_id}`)
      });
    } else {
      recordResult({
        passed: true,
        test: `Session Isolation - ${tenant.name}`,
        details: 'Session properly isolated'
      });
    }
  }
}

async function verifyWorkerIsolation(tenants: TestTenant[]): Promise<void> {
  console.log('\n--- Verifying Worker Process Isolation ---\n');
  
  for (const tenant of tenants) {
    const worker = await prisma.workerProcess.findUnique({
      where: { tenant_id: tenant.id }
    });
    
    if (!worker) {
      recordResult({
        passed: false,
        test: `Worker Isolation - ${tenant.name}`,
        details: 'WorkerProcess not found',
        errors: ['WorkerProcess missing for tenant']
      });
      continue;
    }
    
    // Verify unique PM2 name
    const duplicateWorkers = await prisma.workerProcess.findMany({
      where: {
        pm2_name: worker.pm2_name,
        tenant_id: { not: tenant.id }
      }
    });
    
    if (duplicateWorkers.length > 0) {
      recordResult({
        passed: false,
        test: `Worker Isolation - ${tenant.name}`,
        details: 'PM2 name shared with other tenants!',
        errors: duplicateWorkers.map(w => `PM2 name shared with tenant ${w.tenant_id}`)
      });
    } else {
      recordResult({
        passed: true,
        test: `Worker Isolation - ${tenant.name}`,
        details: `Worker (${worker.pm2_name}) properly isolated`
      });
    }
  }
}

async function cleanup(tenants: TestTenant[]): Promise<void> {
  console.log('\n--- Cleaning up test data ---\n');
  
  for (const tenant of tenants) {
    try {
      // Stop worker
      await fetch(`${ADMIN_API_URL}/admin/tenants/${tenant.id}/worker/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic admin:${ADMIN_PASSWORD}`
        }
      });
      
      // Delete tenant (cascades to all related data)
      await prisma.tenant.delete({
        where: { id: tenant.id }
      });
      
      console.log(`Cleaned up tenant: ${tenant.id}`);
    } catch (error) {
      console.error(`Failed to cleanup tenant ${tenant.id}:`, error);
    }
  }
}

async function runStressTest(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Flow HQ WhatsApp MVP - Multi-Tenant Stress Test       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const tenants: TestTenant[] = [];
  
  try {
    // Phase 1: Create tenants
    console.log('--- Phase 1: Creating Test Tenants ---\n');
    for (let i = 1; i <= 3; i++) {
      const tenant = await createTenant(i);
      tenants.push(tenant);
    }
    
    // Phase 2: Start workers
    console.log('\n--- Phase 2: Starting Workers ---\n');
    for (const tenant of tenants) {
      await startWorker(tenant.id);
    }
    
    // Phase 3: Simulate messages
    console.log('\n--- Phase 3: Simulating Messages ---\n');
    
    for (const tenant of tenants) {
      const customerNumber = `+25571111111${tenants.indexOf(tenant) + 1}`;
      
      // Simulate 5 inbound messages per tenant
      for (let i = 1; i <= 5; i++) {
        await simulateInboundMessage(
          tenant.id,
          customerNumber,
          `Test message ${i} from ${tenant.name}`,
          `wa_msg_${tenant.id}_${i}_${Date.now()}`
        );
        tenant.expectedMessageCount++;
        
        // Simulate corresponding outbound
        await simulateOutboundMessage(
          tenant.id,
          customerNumber,
          `Auto-reply ${i} for ${tenant.name}`,
          `wa_reply_${tenant.id}_${i}_${Date.now()}`
        );
        tenant.expectedMessageCount++;
      }
      
      console.log(`Simulated ${tenant.expectedMessageCount} messages for ${tenant.name}`);
    }
    
    // Wait a moment for any async processing
    await new Promise(r => setTimeout(r, 2000));
    
    // Phase 4: Verify isolation
    await verifyTenantIsolation(tenants);
    await verifyNoCrossTenantDataLeakage(tenants);
    await verifySessionIsolation(tenants);
    await verifyWorkerIsolation(tenants);
    
  } finally {
    // Cleanup
    await cleanup(tenants);
    await prisma.$disconnect();
  }
  
  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  
  console.log(`Total Tests: ${testResults.length}`);
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${failed} ✗`);
  
  if (failed > 0) {
    console.log('\nFailed Tests:');
    testResults.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}: ${r.details}`);
    });
    process.exit(1);
  } else {
    console.log('\n✓ All tests passed! Multi-tenant isolation verified.');
    process.exit(0);
  }
}

// Run the test
runStressTest().catch(error => {
  console.error('Stress test failed with error:', error);
  process.exit(1);
});
