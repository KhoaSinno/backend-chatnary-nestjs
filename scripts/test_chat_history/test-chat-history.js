// /**
//  * Chat History Test Script
//  * Run with: node test-chat-history.js
//  */

const API_URL = 'http://localhost:8080/api/v1/chat/global';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NzdhMzY4ZS1hYmZlLTRhMzgtYWRiZS00NjI1Y2NlOGQ1MDAiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NjcwNjM1NTYsImV4cCI6MTc2NzA3MjU1Nn0.VE3DU3Gh5e36863pMi0bnadMeffdXttsL8dvcLBByG4';

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

// Helper function to make API calls
async function sendChatMessage(message, chatId = null) {
    const url = chatId ? `${API_URL}?chatId=${chatId}` : API_URL;

    console.log(`${colors.cyan}📤 Sending request to: ${url}${colors.reset}`);
    console.log(`${colors.blue}💬 Message: "${message}"${colors.reset}`);
    if (chatId) {
        console.log(`${colors.yellow}🔗 Chat ID: ${chatId}${colors.reset}`);
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`,
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`${colors.green}✅ Response received${colors.reset}`);

        // Extract chatId from nested response structure
        if (data.data && data.data.chatId) {
            data.chatId = data.data.chatId;
        }

        return data;
    } catch (error) {
        console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
        throw error;
    }
}

// Helper function to wait
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Basic chat creation and single message
async function test1_BasicChatCreation() {
    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}`);
    console.log(`TEST 1: Basic Chat Creation - Single Message`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    const response = await sendChatMessage(
        'IG, entropy la gi, tinh nhu nao, trinh bay lai step by step cho toi de hieu di'
    );

    console.log(`\n${colors.green}Response:${colors.reset}`);
    console.log(JSON.stringify(response, null, 2));

    return response.chatId;
}

// Test 2: Follow-up question with history
async function test2_FollowUpQuestion(chatId) {
    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}`);
    console.log(`TEST 2: Follow-up Question - Testing History Context`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    await wait(2000);

    const response = await sendChatMessage(
        'Vay cho toi vi du cu the ve cach tinh entropy nay',
        chatId
    );

    console.log(`\n${colors.green}Response:${colors.reset}`);
    console.log(JSON.stringify(response, null, 2));

    return chatId;
}

// Test 3: Deep follow-up testing memory
async function test3_DeepFollowUp(chatId) {
    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}`);
    console.log(`TEST 3: Deep Follow-up - Testing Long-term Memory`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    await wait(2000);

    const response = await sendChatMessage(
        'Con Information Gain thi sao? Noi ro hon ve cong thuc va y nghia',
        chatId
    );

    console.log(`\n${colors.green}Response:${colors.reset}`);
    console.log(JSON.stringify(response, null, 2));

    return chatId;
}

// Test 4: Reference to earlier conversation
async function test4_ReferenceEarlier(chatId) {
    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}`);
    console.log(`TEST 4: Reference Earlier Context - Testing History Recall`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    await wait(2000);

    const response = await sendChatMessage(
        'Quay lai vi du entropy ban dau, ap dung Information Gain vao do nhu the nao?',
        chatId
    );

    console.log(`\n${colors.green}Response:${colors.reset}`);
    console.log(JSON.stringify(response, null, 2));

    return chatId;
}

// Test 5: New topic to test context switching
async function test5_NewTopicInSameChat(chatId) {
    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}`);
    console.log(`TEST 5: New Topic - Testing Context Switching`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    await wait(2000);

    const response = await sendChatMessage(
        'Gradient Descent hoat dong nhu the nao trong Machine Learning?',
        chatId
    );

    console.log(`\n${colors.green}Response:${colors.reset}`);
    console.log(JSON.stringify(response, null, 2));

    return chatId;
}

// Test 6: Reference both old and new topics
async function test6_MultiTopicReference(chatId) {
    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}`);
    console.log(`TEST 6: Multi-topic Reference - Testing Complex History`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    await wait(2000);

    const response = await sendChatMessage(
        'Entropy va Gradient Descent co lien quan gi voi nhau khong?',
        chatId
    );

    console.log(`\n${colors.green}Response:${colors.reset}`);
    console.log(JSON.stringify(response, null, 2));

    return chatId;
}

// Test 7: Technical deep dive
async function test7_TechnicalDeepDive(chatId) {
    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}`);
    console.log(`TEST 7: Technical Deep Dive - Testing Detailed Context`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    await wait(2000);

    const response = await sendChatMessage(
        'Learning rate trong Gradient Descent anh huong nhu the nao? Cho vi du ve overfitting',
        chatId
    );

    console.log(`\n${colors.green}Response:${colors.reset}`);
    console.log(JSON.stringify(response, null, 2));

    return chatId;
}

// Test 8: Very specific follow-up
async function test8_VerySpecificFollowUp(chatId) {
    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}`);
    console.log(`TEST 8: Very Specific Follow-up - Testing Precision`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    await wait(2000);

    const response = await sendChatMessage(
        'Vi du overfitting ban nay vua noi, cho toi biet cach giai quyet nhu the nao?',
        chatId
    );

    console.log(`\n${colors.green}Response:${colors.reset}`);
    console.log(JSON.stringify(response, null, 2));

    return chatId;
}

// Test 9: New chat session to test isolation
async function test9_NewChatSession() {
    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}`);
    console.log(`TEST 9: New Chat Session - Testing History Isolation`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    await wait(2000);

    const response = await sendChatMessage(
        'Ban vua noi gi ve overfitting?'
    );

    console.log(`\n${colors.green}Response (should not have previous context):${colors.reset}`);
    console.log(JSON.stringify(response, null, 2));

    return response.chatId;
}

// Test 10: Complex LLM concepts
async function test10_ComplexLLMConcepts(chatId) {
    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}`);
    console.log(`TEST 10: Complex LLM Concepts - Testing Advanced Topics`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    await wait(2000);

    const response = await sendChatMessage(
        'Giai thich Transformer architecture va self-attention mechanism',
        chatId
    );

    console.log(`\n${colors.green}Response:${colors.reset}`);
    console.log(JSON.stringify(response, null, 2));

    return chatId;
}

// Test 11: Follow-up on Transformer
async function test11_TransformerFollowUp(chatId) {
    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}`);
    console.log(`TEST 11: Transformer Follow-up - Testing Recent Context`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    await wait(2000);

    const response = await sendChatMessage(
        'Multi-head attention trong Transformer khac gi voi single-head attention?',
        chatId
    );

    console.log(`\n${colors.green}Response:${colors.reset}`);
    console.log(JSON.stringify(response, null, 2));

    return chatId;
}

// Test 12: Long conversation chain reference
async function test12_LongChainReference(chatId) {
    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}`);
    console.log(`TEST 12: Long Chain Reference - Testing Full History Recall`);
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    await wait(2000);

    const response = await sendChatMessage(
        'Tom lai tat ca cac khai niem chinh chung ta da noi tu luc bat dau: Entropy, IG, Gradient Descent, va Transformer',
        chatId
    );

    console.log(`\n${colors.green}Response:${colors.reset}`);
    console.log(JSON.stringify(response, null, 2));

    return chatId;
}

// Main test runner
async function runAllTests() {
    console.log(`${colors.bright}${colors.blue}`);
    console.log(`╔${'═'.repeat(78)}╗`);
    console.log(`║${' '.repeat(20)}CHAT HISTORY COMPREHENSIVE TEST${' '.repeat(25)}║`);
    console.log(`║${' '.repeat(78)}║`);
    console.log(`║${' '.repeat(15)}Testing AI/LLM/ML Knowledge Base${' '.repeat(30)}║`);
    console.log(`╚${'═'.repeat(78)}╝`);
    console.log(colors.reset);

    try {
        // Test sequence with first chat session
        let chatId = await test1_BasicChatCreation();

        if (!chatId) {
            console.error(`${colors.red}❌ Failed to get chatId from first message${colors.reset}`);
            return;
        }

        chatId = await test2_FollowUpQuestion(chatId);
        chatId = await test3_DeepFollowUp(chatId);
        chatId = await test4_ReferenceEarlier(chatId);
        chatId = await test5_NewTopicInSameChat(chatId);
        chatId = await test6_MultiTopicReference(chatId);
        chatId = await test7_TechnicalDeepDive(chatId);
        chatId = await test8_VerySpecificFollowUp(chatId);

        // Test new chat session (isolation)
        const newChatId = await test9_NewChatSession();

        if (newChatId) {
            await test10_ComplexLLMConcepts(newChatId);
            await test11_TransformerFollowUp(newChatId);
        }

        // Final comprehensive test on original chat
        await test12_LongChainReference(chatId);

        console.log(`\n${colors.bright}${colors.green}`);
        console.log(`╔${'═'.repeat(78)}╗`);
        console.log(`║${' '.repeat(25)}ALL TESTS COMPLETED${' '.repeat(34)}║`);
        console.log(`╚${'═'.repeat(78)}╝`);
        console.log(colors.reset);

        console.log(`\n${colors.yellow}📊 Test Summary:${colors.reset}`);
        console.log(`✅ Tested basic chat creation`);
        console.log(`✅ Tested follow-up questions with history`);
        console.log(`✅ Tested deep conversation memory`);
        console.log(`✅ Tested reference to earlier context`);
        console.log(`✅ Tested context switching (new topics)`);
        console.log(`✅ Tested multi-topic references`);
        console.log(`✅ Tested technical deep dives`);
        console.log(`✅ Tested specific follow-ups`);
        console.log(`✅ Tested chat session isolation`);
        console.log(`✅ Tested complex LLM concepts`);
        console.log(`✅ Tested long conversation chain recall`);

    } catch (error) {
        console.error(`\n${colors.bright}${colors.red}`);
        console.log(`╔${'═'.repeat(78)}╗`);
        console.log(`║${' '.repeat(30)}TEST FAILED${' '.repeat(37)}║`);
        console.log(`╚${'═'.repeat(78)}╝`);
        console.log(colors.reset);
        console.error(error);
        process.exit(1);
    }
}

// Run tests
runAllTests();
