export type TestLogTag = '[TEST_FLOW]' | '[TEST_DB_WRITE]' | '[TEST_FAILURE]';

export type TestLogEntry = {
  tag: TestLogTag;
  message: string;
  metadata?: Record<string, unknown>;
};

export const testLogs: TestLogEntry[] = [];

export function testLog(tag: TestLogTag, message: string, metadata?: Record<string, unknown>) {
  const entry = { tag, message, metadata };
  testLogs.push(entry);
  console.log(tag, message, metadata ?? '');
}

export function clearTestLogs() {
  testLogs.length = 0;
}
