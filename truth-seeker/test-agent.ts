/**
 * Quick test of the Detective Agent
 */

import { detectiveAgent } from './agents/detective-agent';

async function testAgent() {
  console.log('🕵️ Testing Detective Agent...\n');

  // Subscribe to updates
  detectiveAgent.onUpdate((update) => {
    const icon = update.type === 'thought' ? '💭' :
                 update.type === 'tool_call' ? '🔧' :
                 update.type === 'finding' ? '🎯' : '📝';

    console.log(`${icon} [${update.type}]`);
    console.log(`   ${update.content}`);
    if (update.data) {
      console.log(`   Data: ${JSON.stringify(update.data, null, 2).substring(0, 200)}...`);
    }
    console.log('');
  });

  // Run investigation
  await detectiveAgent.runInvestigationCycle();

  console.log('\n✅ Investigation complete!');
}

testAgent().catch(console.error);
