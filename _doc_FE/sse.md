# Test

curl -X POST http://localhost:8080/api/v1/notifications/test-emit \
 -H "Content-Type: application/json" \
 -d '{"userId":"test-user-001","type":"DOCUMENT_PROCESSED","status":"DONE","message":"Test"}'

# Implement

const eventSource = new EventSource(
`http://localhost:8080/api/v1/notifications/sse?userId=${userId}`
);

eventSource.onmessage = (event) => {
const { type, payload, timestamp } = JSON.parse(event.data);
console.log('Notification:', type, payload);
};
