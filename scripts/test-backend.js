const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testTranscription() {
    console.log('🎤 Testing Transcription with owl audio file\n');

    const form = new FormData();
    const audioPath = './owl option 2 SENTENCE.mp3';

    if (!fs.existsSync(audioPath)) {
        console.error('❌ Audio file not found:', audioPath);
        return;
    }

    form.append('audio', fs.createReadStream(audioPath));

    try {
        console.log('📤 Sending audio to transcription endpoint');
        const response = await fetch('http://localhost:4000/transcribe', {
            method: 'POST',
            body: form,
        });

        if (!response.ok) {
            console.error('❌ Transcription failed:', response.status, response.statusText);
            const error = await response.text();
            console.error('Error:', error);
            return;
        }

        const result = await response.json();
        console.log('\n✅ Transcription successful!');
        console.log('📝 Transcript:', result.transcript);
        console.log('\n---\n');

        // Now test AI summarization
        console.log('🤖 Testing AI Summarization');
        const summaryResponse = await fetch('http://localhost:4000/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: result.transcript }),
        });

        if (!summaryResponse.ok) {
            console.error('❌ Summarization failed:', summaryResponse.status);
            return;
        }

        const summary = await summaryResponse.json();
        console.log('\n✅ AI Summary generated!');
        console.log('\n📋 Summary:', summary.summary);
        console.log('\n🔑 Key Points:');
        summary.keyPoints.forEach((point, i) => {
            console.log(`  ${i + 1}. ${point}`);
        });
        if (summary.titleSuggestion) {
            console.log('\n💡 Suggested Title:', summary.titleSuggestion);
        }

        console.log('\n✨ All tests passed! Backend is working perfectly! ✨\n');

    } catch (error) {
        console.error('❌ Error during test:', error.message);
    }
}

testTranscription();
