import { voidSdk } from '@void-hq/sdk';

async function runDemoAgent() {
  console.log('====================================================');
  console.log('🚀 [VOID DEMO] Initializing Telemetry SDK...');
  console.log('====================================================');

  await voidSdk.init({
    serviceName: 'void-demo-agent',
    environment: 'demo-self-hosted',
    serverUrl: process.env.VOID_SERVER_URL || 'http://localhost:3001',
    otlp: {
      endpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
    },
  });

  console.log('✅ SDK initialized (SigNoz:', process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'localhost:4318', '| Server:', process.env.VOID_SERVER_URL || 'localhost:3001', ')');
  console.log('\n🤖 Starting AI Agent Execution Loop...\n');

  const result = await voidSdk.agent(
    {
      name: 'CustomerSupportAgent',
      role: 'ai-assistant',
      promptVersion: 'v1.4.0',
    },
    async () => {
      voidSdk.setAttribute('customer.id', 'cust_882910');
      voidSdk.setAttribute('customer.tier', 'enterprise');

      console.log('  🔍 Step 1: Querying User Account Details...');
      const userProfile = await voidSdk.tool(
        {
          name: 'fetchUserProfile',
          input: { userId: 'cust_882910' },
        },
        async () => {
          await new Promise((r) => setTimeout(r, 120));
          return { name: 'Alice Smith', tier: 'enterprise', status: 'active' };
        }
      );
      voidSdk.event('user_profile_retrieved', { userId: userProfile.name });

      console.log('  📦 Step 2: Checking Recent Subscriptions & Telemetry...');
      const orders = await voidSdk.tool(
        {
          name: 'getOrdersHistory',
          input: { userId: 'cust_882910', limit: 5 },
        },
        async () => {
          await new Promise((r) => setTimeout(r, 200));
          return [
            { id: 'order_901', item: 'Pro Plan Subscription', status: 'delivered' },
            { id: 'order_902', item: 'SigNoz Self-Host Addon', status: 'active' },
          ];
        }
      );
      voidSdk.event('orders_retrieved', { count: orders.length });

      console.log('  ⚡ Step 3: Running AI Inference / Reasoning Step...');
      const reasoning = await voidSdk.span(
        'llm-reasoning-step',
        async () => {
          await new Promise((r) => setTimeout(r, 350));
          return 'Customer is eligible for self-hosted SigNoz integration support.';
        },
        { 'llm.model': 'gemini-2.5-flash', 'llm.tokens.used': 412 }
      );

      console.log('  💬 Decision:', reasoning);
      return { userProfile, orders, status: 'success', summary: reasoning };
    }
  );

  console.log('\n✨ Agent Execution Completed Successfully!');
  console.log('📊 Result:', JSON.stringify(result, null, 2));

  console.log('\n====================================================');
  console.log('⏳ Flushing OpenTelemetry spans to SigNoz...');
  await voidSdk.shutdown();
  console.log('🎉 Telemetry successfully dispatched!');
  console.log('====================================================\n');
}

runDemoAgent().catch((err) => {
  console.error('❌ Demo Error:', err);
  process.exit(1);
});
