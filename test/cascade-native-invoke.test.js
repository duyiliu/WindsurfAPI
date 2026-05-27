import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReverseLookup, mapCascadeToolCallToCaller } from '../src/cascade-native-bridge.js';

describe('cascade native bridge invoke mapping', () => {
  test('maps Windsurf view_file invoke target_file back to Claude Read.file_path', () => {
    const tools = [
      { type: 'function', function: { name: 'Read', parameters: { type: 'object' } } },
    ];
    const lookup = buildReverseLookup(tools);
    const mapped = mapCascadeToolCallToCaller({
      id: 'call_native_xml_1',
      name: 'view_file',
      argumentsJson: JSON.stringify({ target_file: '/etc/hostname' }),
    }, lookup);

    assert.ok(mapped);
    assert.equal(mapped.name, 'Read');
    assert.deepEqual(JSON.parse(mapped.argumentsJson), { file_path: '/etc/hostname' });
  });

  test('maps Windsurf run_command invoke command_line back to Claude Bash.command', () => {
    const tools = [
      { type: 'function', function: { name: 'Bash', parameters: { type: 'object' } } },
    ];
    const lookup = buildReverseLookup(tools);
    const mapped = mapCascadeToolCallToCaller({
      id: 'call_native_xml_2',
      name: 'run_command',
      argumentsJson: JSON.stringify({ command_line: 'echo GLM51_NATIVE_OK' }),
    }, lookup);

    assert.ok(mapped);
    assert.equal(mapped.name, 'Bash');
    assert.deepEqual(JSON.parse(mapped.argumentsJson), { command: 'echo GLM51_NATIVE_OK' });
  });
});
