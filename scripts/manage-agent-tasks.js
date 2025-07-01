#!/usr/bin/env node

/**
 * Manages auto-generated metadata in agent task files
 * Updates "After Completion" and "Next Action" based on task numbering
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TASKS_DIR = join(__dirname, '..', '.claude', 'tasks');

const CONFIG = {
  mergeAfterTasks: 1,      // Merge after every task
  techDebtAfterTasks: 3,    // Tech debt review every 3 tasks
};

// Method definitions
const METHODS = {
  'multi-pass-development': {
    phases: { tick: 5, tock: 6 },
    phaseNames: [
      'Phase 1 - Make it Work',
      'Phase 2 - Make it Right', 
      'Phase 3 - Make it Safe',
      'Phase 4 - Make it Tested',
      'Phase 5 - Make it Documented',
      'Phase 6 - Tech Debt Review'
    ]
  },
  'rapid-fix': {
    phases: { tick: 2, tock: 2 },
    phaseNames: ['Phase 1 - Fix Issue', 'Phase 2 - Add Test']
  },
  'docs-only': {
    phases: { tick: 1, tock: 1 },
    phaseNames: ['Phase 1 - Write Documentation']
  }
};

/**
 * Determine which method to use for a task
 */
function determineMethod(taskContent, taskFileName) {
  // Look for explicit method declaration
  const methodMatch = taskContent.match(/Method:\s*([^\n]+)/i);
  if (methodMatch) {
    const methodName = methodMatch[1].toLowerCase().replace(/\s+/g, '-');
    if (METHODS[methodName]) return methodName;
  }
  
  // Default based on task type
  if (taskFileName.includes('fix') || taskFileName.includes('bug')) {
    return 'rapid-fix';
  }
  if (taskFileName.includes('doc') || taskFileName.includes('readme')) {
    return 'docs-only';
  }
  
  // Default to multi-pass
  return 'multi-pass-development';
}

/**
 * Update auto-managed section in a task file
 */
function updateAutoSection(content, method, phaseCount, afterCompletion, nextAction) {
  const autoStart = '<!-- AUTO-MANAGED: Do not edit below this line -->';
  const autoEnd = '<!-- END AUTO-MANAGED -->';
  
  const methodDisplay = method.split('-').map(w => 
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');
  
  const newSection = `${autoStart}
**Method**: ${methodDisplay} with ${phaseCount} Phases
**Next Action**: ${nextAction}
${autoEnd}`;

  if (content.includes(autoStart)) {
    // Replace existing section
    return content.replace(
      /<!-- AUTO-MANAGED:.*?<!-- END AUTO-MANAGED -->/s,
      newSection
    );
  } else {
    // Insert after title (first line starting with #)
    const lines = content.split('\n');
    const titleIndex = lines.findIndex(line => line.startsWith('#'));
    if (titleIndex >= 0) {
      lines.splice(titleIndex + 2, 0, newSection);
      return lines.join('\n');
    }
    // Fallback: add at beginning
    return newSection + '\n\n' + content;
  }
}

/**
 * Process tasks for a single agent
 */
async function updateAgentTasks(agentDir) {
  const files = await readdir(agentDir).catch(() => []);
  
  // Filter and sort task files
  const tasks = files
    .filter(f => f.endsWith('.md'))
    .filter(f => !f.includes('-COMPLETE'))
    .sort((a, b) => {
      const numA = parseInt(a.split('-')[0]) || 999;
      const numB = parseInt(b.split('-')[0]) || 999;
      return numA - numB;
    });

  for (let i = 0; i < tasks.length; i++) {
    const taskPath = join(agentDir, tasks[i]);
    const content = await readFile(taskPath, 'utf8');
    
    // Extract task number
    const taskNum = parseInt(tasks[i].split('-')[0]);
    if (isNaN(taskNum)) continue;
    
    // Determine method and phase count
    const method = determineMethod(content, tasks[i]);
    const isTock = taskNum % CONFIG.techDebtAfterTasks === 0;
    const phaseCount = METHODS[method].phases[isTock ? 'tock' : 'tick'];
    
    // Determine next action based on current phase
    let nextAction;
    
    // Check if we're in the middle of phases
    const currentPhaseMatch = content.match(/\*\*Current Phase\*\*:\s*Phase\s*(\d+)/);
    if (currentPhaseMatch) {
      const currentPhase = parseInt(currentPhaseMatch[1]);
      if (currentPhase < phaseCount) {
        nextAction = `continue to phase ${currentPhase + 1}`;
      } else {
        // Last phase completed
        const nextTask = tasks[i + 1];
        if (nextTask) {
          const nextNum = parseInt(nextTask.split('-')[0]);
          nextAction = nextNum ? `continue to task ${String(nextNum).padStart(3, '0')}` : 'continue to next task';
        } else {
          nextAction = 'await new tasks';
        }
      }
    } else {
      // No current phase, start from phase 1
      nextAction = 'continue to phase 1';
    }
    
    // Update the file
    const updated = updateAutoSection(content, method, phaseCount, null, nextAction);
    if (updated !== content) {
      await writeFile(taskPath, updated);
      console.log(`✅ Updated: ${tasks[i]}`);
    }
  }
}

/**
 * Show status of all agents
 */
async function showStatus() {
  const agents = ['agent-0', 'agent-1', 'agent-2', 'agent-3'];
  
  console.log('\n📊 Agent Task Status\n');
  
  for (const agent of agents) {
    const agentDir = join(TASKS_DIR, agent);
    const files = await readdir(agentDir).catch(() => []);
    
    const tasks = files
      .filter(f => f.endsWith('.md'))
      .sort((a, b) => {
        const numA = parseInt(a.split('-')[0]) || 999;
        const numB = parseInt(b.split('-')[0]) || 999;
        return numA - numB;
      });
    
    console.log(`${agent}:`);
    
    for (const task of tasks) {
      let status = '📋 TODO';
      if (task.includes('-ACTIVE')) status = '🔄 ACTIVE';
      if (task.includes('-BLOCKED')) status = '🚫 BLOCKED';
      if (task.includes('-COMPLETE')) status = '✅ COMPLETE';
      
      console.log(`  ${status} ${task}`);
    }
    
    console.log('');
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2];
  
  if (command === 'status') {
    await showStatus();
    return;
  }
  
  // Default: update all agent tasks
  console.log('🔄 Updating agent task metadata...\n');
  
  const agents = ['agent-0', 'agent-1', 'agent-2', 'agent-3'];
  
  for (const agent of agents) {
    console.log(`Processing ${agent}...`);
    await updateAgentTasks(join(TASKS_DIR, agent));
  }
  
  console.log('\n✨ Task metadata updated!');
  console.log('Run with "status" argument to see task status.');
}

// Run if called directly
if (import.meta.url.startsWith('file:')) {
  main().catch(console.error);
}