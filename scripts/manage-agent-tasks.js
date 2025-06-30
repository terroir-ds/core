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

/**
 * Update auto-managed section in a task file
 */
function updateAutoSection(content, afterCompletion, nextAction) {
  const autoStart = '<!-- AUTO-MANAGED: Do not edit below this line -->';
  const autoEnd = '<!-- END AUTO-MANAGED -->';
  
  const newSection = `${autoStart}
**After Completion**: ${afterCompletion}
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
    
    // Determine what happens after this task
    let afterCompletion;
    let nextAction;
    
    if (taskNum % CONFIG.techDebtAfterTasks === 0) {
      // This is a tech debt review point
      afterCompletion = 'tech debt review, then merge to develop';
    } else {
      // Regular task - just merge
      afterCompletion = 'merge to develop';
    }
    
    // Determine next action
    const nextTask = tasks[i + 1];
    if (nextTask) {
      const nextNum = parseInt(nextTask.split('-')[0]);
      nextAction = nextNum ? `continue to task ${String(nextNum).padStart(3, '0')}` : 'continue to next task';
    } else {
      nextAction = 'await new tasks';
    }
    
    // Update the file
    const updated = updateAutoSection(content, afterCompletion, nextAction);
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