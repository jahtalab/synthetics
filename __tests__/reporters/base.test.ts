/**
 * Disable the ANSI codes for kleur/colors module
 */
process.env.NO_COLOR = '1';

import fs from 'fs';
import { runner, step, journey } from '../../src/dsl';
import BaseReporter from '../../src/reporters/base';
import { generateTempPath } from '../../src/helpers';

describe('base reporter', () => {
  const dest = generateTempPath();
  afterAll(() => {
    fs.unlinkSync(dest);
    process.env.NO_COLOR = '';
  });

  it('writes each step to the FD', async () => {
    jest.spyOn(process, 'hrtime').mockImplementation(() => {
      return [0, 0];
    });
    const { stream } = new BaseReporter(runner, { fd: fs.openSync(dest, 'w') });
    const j1 = journey('j1', () => {});
    runner.emit('journey:start', {
      journey: j1,
      params: {},
      timestamp: 1600300800000000,
    });
    const error = {
      name: 'Error',
      message: 'step failed',
      stack: 'Error: step failed',
    };
    runner.emit('step:end', {
      journey: j1,
      status: 'failed',
      error,
      step: step('s1', async () => {}),
      durationMs: 10,
      url: 'dummy',
      start: 0,
      end: 10,
      timestamp: 1600300800000000,
    });
    runner.emit('end', 'done');
    /**
     * Close the underyling stream writing to FD to read all its contents
     */
    stream.end();
    await new Promise(resolve => stream.once('finish', resolve));
    const fd = fs.openSync(dest, 'r');
    const buffer = fs.readFileSync(fd);
    expect(buffer.toString()).toMatchSnapshot();
  });
});
