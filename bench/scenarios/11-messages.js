'use strict';

const COUNT = 10000;
const TYPES = 10;

module.exports = {
  name: 'messages',
  description: `dispatch ${COUNT} messages of ${TYPES} types, each type has a subscriber`,
  setup(tk) {
    const types = Array.from({length: TYPES}, () => class {
      constructor(value) {
        this.value = value;
      }
    });
    const engine = new tk.Engine();
    const state = {engine, types, total: 0, messages: []};
    for (const Type of types) {
      engine.subscribe(Type, (message) => {
        state.total += message.value;
      });
    }
    for (let i = 0; i < COUNT; i++) state.messages.push(new types[i % TYPES](i));
    return state;
  },
  run({engine, messages}) {
    for (let i = 0; i < messages.length; i++) engine.dispatch(messages[i]);
  },
};
