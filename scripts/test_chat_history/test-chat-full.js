// /**
//  * Comprehensive Chat History Test - FULL LOGGING VERSION
//  * Lưu đầy đủ câu hỏi, câu trả lời, citations, và tất cả metadata
//  */

const fs = require('fs');

const API_URL = 'http://localhost:8080/api/v1/chat/global';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NzdhMzY4ZS1hYmZlLTRhMzgtYWRiZS00NjI1Y2NlOGQ1MDAiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NjcwNjU3NjUsImV4cCI6MTc2NzA3NDc2NX0.fWHNiQp-A4Ducrq9dNCqH9s03RWPR_vYza7UdZOHGDU';

const LOG_FILE = 'test-full-log.txt';
const RESULTS_FILE = 'test-full-results.json';

const testResults = [];
let logContent = '';

// Helper to log both console and file
function log(message) {
    console.log(message);
    logContent += message + '\n';
}

// Helper to save logs periodically
function saveLogs() {
    fs.writeFileSync(LOG_FILE, logContent);
}

async function sendChatMessage(message, chatId = null, testName) {
    const url = chatId ? `${API_URL}?chatId=${chatId}` : API_URL;

    log(`\n${'='.repeat(80)}`);
    log(`📝 ${testName}`);
    log(`${'='.repeat(80)}`);
    log(`📤 URL: ${url}`);
    log(`💬 MESSAGE: "${message}"`);
    if (chatId) log(`🔗 CHAT ID: ${chatId}`);
    log(`⏰ TIME: ${new Date().toISOString()}`);

    const startTime = Date.now();

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`,
            },
            body: JSON.stringify({ message }),
        });

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const answer = data.data?.answer || 'NO ANSWER';
        const citations = data.data?.citations || [];
        const returnedChatId = data.data?.chatId || data.chatId;

        // Log full response
        log(`\n✅ RESPONSE RECEIVED (${responseTime}ms)`);
        log(`${'─'.repeat(80)}`);
        log(`📋 STATUS CODE: ${data.statusCode}`);
        log(`🆔 CHAT ID: ${returnedChatId}`);
        log(`\n📝 ANSWER (${answer.length} chars):`);
        log(`${'─'.repeat(40)}`);
        log(answer);
        log(`${'─'.repeat(40)}`);

        log(`\n📚 CITATIONS (${citations.length} items):`);
        citations.forEach((cit, idx) => {
            log(`  [${idx + 1}] Score: ${cit.score?.toFixed(4) || 'N/A'} | File: ${cit.fileUrl?.split('/').pop() || 'N/A'} | Page: ${cit.page || 'N/A'}`);
        });

        // Store full result
        const result = {
            testName,
            success: true,
            chatId: returnedChatId,
            message,
            answer: answer,  // FULL ANSWER
            answerLength: answer.length,
            citations: citations.map(c => ({
                score: c.score,
                file: c.fileUrl?.split('/').pop(),
                page: c.page,
                snippet: c.snippet?.substring(0, 100)
            })),
            citationsCount: citations.length,
            responseTime,
            timestamp: new Date().toISOString(),
            rawResponse: data  // FULL RAW RESPONSE
        };

        testResults.push(result);
        saveLogs();  // Save after each test

        return result;

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`);

        const result = {
            testName,
            success: false,
            message,
            error: error.message,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
        };

        testResults.push(result);
        saveLogs();
        throw error;
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    log('╔' + '═'.repeat(78) + '╗');
    log('║' + ' '.repeat(20) + 'CHAT HISTORY COMPREHENSIVE TEST' + ' '.repeat(25) + '║');
    log('║' + ' '.repeat(20) + 'Full Logging Version - ' + new Date().toISOString().split('T')[0] + ' '.repeat(17) + '║');
    log('╚' + '═'.repeat(78) + '╝');
    log(`\n🚀 Starting tests at ${new Date().toISOString()}\n`);

    try {
        // Test 1: Create new chat - Entropy & IG
        const test1 = await sendChatMessage(
            'IG, entropy la gi, tinh nhu nao, trinh bay lai step by step cho toi de hieu di',
            null,
            'TEST 1: Create New Chat - Hỏi về Entropy & Information Gain'
        );

        if (!test1.chatId) {
            throw new Error('No chatId returned from first message');
        }

        await wait(3000);

        // Test 2: Follow-up về Entropy
        const test2 = await sendChatMessage(
            'Vay cho toi vi du cu the ve cach tinh entropy nay',
            test1.chatId,
            'TEST 2: Follow-up - Yêu cầu ví dụ về Entropy (phải nhớ context)'
        );

        await wait(3000);

        // Test 3: Hỏi thêm về IG
        const test3 = await sendChatMessage(
            'Con Information Gain thi sao? Noi ro hon ve cong thuc va y nghia',
            test1.chatId,
            'TEST 3: Deep Context - Hỏi thêm về Information Gain'
        );

        await wait(3000);

        // Test 4: Reference back to earlier
        const test4 = await sendChatMessage(
            'Quay lai vi du entropy ban dau, ap dung Information Gain vao do nhu the nao?',
            test1.chatId,
            'TEST 4: Earlier Reference - Quay lại ví dụ đầu tiên (test memory)'
        );

        await wait(3000);

        // Test 5: New topic - Gradient Descent
        const test5 = await sendChatMessage(
            'Gradient Descent hoat dong nhu the nao trong Machine Learning?',
            test1.chatId,
            'TEST 5: Topic Switch - Chuyển sang Gradient Descent'
        );

        await wait(3000);

        // Test 6: Multi-topic reference
        const test6 = await sendChatMessage(
            'Entropy va Gradient Descent co lien quan gi voi nhau khong?',
            test1.chatId,
            'TEST 6: Multi-topic - Hỏi về mối liên hệ 2 concepts'
        );

        await wait(3000);

        // Test 7: NEW CHAT - Test isolation
        const test7 = await sendChatMessage(
            'Ban vua noi gi ve overfitting?',
            null,  // NEW CHAT - không có chatId
            'TEST 7: NEW CHAT (Isolation) - Hỏi về overfitting KHÔNG có context'
        );

        await wait(3000);

        // Test 8: Continue new chat
        const test8 = await sendChatMessage(
            'Giai thich Transformer architecture va self-attention',
            test7.chatId,
            'TEST 8: New Chat Continue - Hỏi về Transformer trong chat mới'
        );

        await wait(3000);

        // Test 9: Back to original chat - Full recall
        const test9 = await sendChatMessage(
            'Tom lai tat ca cac khai niem chinh chung ta da noi tu luc bat dau: Entropy, IG, Gradient Descent',
            test1.chatId,
            'TEST 9: Full History Recall - Yêu cầu tổng hợp toàn bộ conversation'
        );

        // Final summary
        log('\n' + '═'.repeat(80));
        log('                         ALL TESTS COMPLETED');
        log('═'.repeat(80));

        const successCount = testResults.filter(r => r.success).length;
        const failCount = testResults.filter(r => !r.success).length;
        const avgTime = testResults.reduce((sum, r) => sum + r.responseTime, 0) / testResults.length;
        const totalAnswerChars = testResults.reduce((sum, r) => sum + (r.answerLength || 0), 0);

        log(`\n📊 SUMMARY:`);
        log(`   ✅ Successful: ${successCount}/${testResults.length}`);
        log(`   ❌ Failed: ${failCount}/${testResults.length}`);
        log(`   ⏱️  Avg Response Time: ${(avgTime / 1000).toFixed(2)}s`);
        log(`   📝 Total Answer Characters: ${totalAnswerChars}`);
        log(`   📚 Total Citations: ${testResults.reduce((sum, r) => sum + (r.citationsCount || 0), 0)}`);

        // Save full results
        const finalReport = {
            executionTime: new Date().toISOString(),
            summary: {
                totalTests: testResults.length,
                successfulTests: successCount,
                failedTests: failCount,
                avgResponseTime: avgTime,
                totalAnswerCharacters: totalAnswerChars
            },
            results: testResults
        };

        fs.writeFileSync(RESULTS_FILE, JSON.stringify(finalReport, null, 2));
        saveLogs();

        log(`\n💾 Full results saved to: ${RESULTS_FILE}`);
        log(`💾 Full logs saved to: ${LOG_FILE}`);
        log(`\n✅ Test execution completed at ${new Date().toISOString()}`);

        return finalReport;

    } catch (error) {
        log(`\n❌ TEST EXECUTION FAILED: ${error.message}`);
        saveLogs();

        const partialReport = {
            executionTime: new Date().toISOString(),
            error: error.message,
            results: testResults
        };

        fs.writeFileSync(RESULTS_FILE, JSON.stringify(partialReport, null, 2));
        process.exit(1);
    }
}

// Run tests
runTests();
