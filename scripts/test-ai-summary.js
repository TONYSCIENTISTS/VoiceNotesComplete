const fetch = require('node-fetch');

async function testAISummary() {
    console.log('🤖 Testing AI Summarization with mock transcript\n');

    // Mock transcript (simulating what Whisper would return)
    const mockTranscript = `
    The owl is a fascinating nocturnal bird known for its distinctive appearance and hunting abilities.
    Owls have excellent night vision and can rotate their heads up to 270 degrees.
    They are found on every continent except Antarctica and play an important role in controlling rodent populations.
    Different species of owls vary greatly in size, from the tiny Elf Owl to the massive Eurasian Eagle-Owl.
  `.trim();

    try {
        console.log('📤 Sending transcript to AI summarization endpoint');
        console.log('📝 Transcript length:', mockTranscript.length, 'characters\n');

        const response = await fetch('http://localhost:4000/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: mockTranscript }),
        });

        if (!response.ok) {
            console.error('❌ Summarization failed:', response.status, response.statusText);
            const error = await response.text();
            console.error('Error:', error);
            return;
        }

        const summary = await response.json();
        console.log('✅ AI Summary generated!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(summary.summary);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔑 KEY POINTS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        summary.keyPoints.forEach((point, i) => {
            console.log(`  ${i + 1}. ${point}`);
        });

        if (summary.titleSuggestion) {
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('💡 SUGGESTED TITLE:', summary.titleSuggestion);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }

        console.log('\n✨ AI Summarization test passed! GPT-4o-mini is working! ✨\n');

    } catch (error) {
        console.error('❌ Error during test:', error.message);
        console.error(error);
    }
}

async function testHealth() {
    console.log('🏥 Testing Health endpoint...\n');

    try {
        const response = await fetch('http://localhost:4000/health');
        const result = await response.json();
        console.log('✅ Health check:', result);
        console.log('');
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
}

async function runAllTests() {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   BACKEND API TESTING SUITE          ║');
    console.log('╚═══════════════════════════════════════╝\n');

    await testHealth();
    await testAISummary();

    console.log('╔═══════════════════════════════════════╗');
    console.log('║   ALL TESTS COMPLETE!                 ║');
    console.log('╚═══════════════════════════════════════╝\n');
}

runAllTests();
