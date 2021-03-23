import {Signal} from '../../src/utils/Signal';

describe('Signals', function () {
  it('Connecting increases amount of handlers', () => {
    const signal = new Signal<(value: number) => void>();
    signal.connect((value: number) => {});
    expect(signal.hasHandlers).toBeTruthy();
    expect(signal.handlersAmount).toEqual(1);
  });

  it('Connecting same handler twice add it only once', () => {
    const signal = new Signal<(value: number) => void>();
    const handler = (value: number) => {};
    signal.connect(handler);
    signal.connect(handler);
    expect(signal.handlersAmount).toBe(1);
  });

  it('Disconnecting decreases amount of handlers', () => {
    const signal = new Signal<(value: number) => void>();
    const handler = (value: number) => {};
    signal.connect(handler);
    signal.disconnect(handler);
    expect(signal.hasHandlers).toBeFalsy();
  });

  it('Disconnecting not connected handler don\'t remove any existing handler', () => {
    const signal = new Signal<(value: number) => void>();
    const addedHandler = (value: number) => {};
    const wrongHandler = (value: number) => {};
    signal.connect(addedHandler);
    signal.disconnect(wrongHandler);
    expect(signal.handlersAmount).toEqual(1);
  });

  it('Disconnecting all handlers clears them from signal', () => {
    const signal = new Signal<(value: number) => void>();
    signal.connect(() => {});
    signal.connect(() => {});
    signal.connect(() => {});
    signal.disconnectAll();
    expect(signal.hasHandlers).toBeFalsy();
  });
});
