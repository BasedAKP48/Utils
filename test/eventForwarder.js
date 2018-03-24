const EventEmitter = require('events');
const { expect } = require('chai');
const forward = require('../lib/eventForwarder');

describe('eventForwarder', () => {
  const event1 = new EventEmitter();
  const event2 = new EventEmitter();
  describe('forwarded', () => {
    forward(event1, event2);
    it('should be forwarded', () => {
      let called = false;
      let forwarded = false;
      event1.once('event', () => { called = true; });
      event2.once('event', () => { forwarded = true; });
      expect(event1.emit('event')).to.be.true;
      expect(called).to.be.true;
      expect(forwarded).to.be.true;
    });
    it('should not go backwards', () => {
      let called = false;
      event1.once('event', () => { called = true; });
      expect(event2.emit('event')).to.be.false;
      expect(called).to.be.false;
      expect(event1.emit('event')).to.be.true;
    });
    it('should keep the arguments', () => {
      let arg1 = null;
      let arg2 = null;
      event2.once('event', (a1, a2) => { arg1 = a1; arg2 = a2; });
      expect(event1.emit('event', 'arg1', 'arg2')).to.be.true;
      expect(arg1).to.equal('arg1');
      expect(arg2).to.equal('arg2');
    });
    it('should unforward', () => {
      let called = false;
      let forwarded = false;
      event1.emit.undo();
      event1.once('event', () => { called = true; });
      event2.once('event', () => { forwarded = true; });
      expect(event1.emit('event')).to.be.true;
      expect(called).to.be.true;
      expect(forwarded).to.be.false;
      expect(event1.emit.undo).to.be.undefined;
    });
  });
  // These tests cause event1 to be undone after each test
  describe('options', () => {
    afterEach(event1.emit.undo);
    it('should be prefixed', () => {
      let forwarded = false;
      let event = false;
      forward(event1, event2, 'forwarded');
      event2.once('forwardedevent', () => { forwarded = true; });
      event2.once('event', () => { event = true; });
      event1.emit('event');
      expect(forwarded, 'Failed to prefix event').to.be.true;
      expect(event, 'Forwarded unprefixed event').to.be.false;
    });
    it('should be properly forwarded or disabled', () => {
      let disabled = false;
      let called = false;
      let badPrefix = false;
      forward(event1, event2, ['disabled']);
      event2.once('disabled', () => { disabled = true; });
      event2.once('event', () => { called = true; });
      event2.once('disabledevent', () => { badPrefix = true; });
      event1.emit('disabled');
      event1.emit('event');
      expect(disabled, 'Forwarded disabled event').to.be.false;
      expect(badPrefix, 'Forwarded with a bad prefix').to.be.false;
      expect(called, 'Failed to forward event').to.be.true;
    });
    it('should still work when prefix and except are passed', () => {
      let enabled = false;
      let disabled = false;
      forward(event1, event2, { prefix: 'event-', except: ['disabled'] });
      event2.once('event-enabled', () => { enabled = true; });
      event2.once('event-disabled', () => { disabled = true; });
      event1.emit('enabled');
      event1.emit('disabled');
      expect(enabled, 'Failed to forward event').to.be.true;
      expect(disabled, 'Forwarded disabled event').to.be.false;
    });
    it('should allow except to be a string', () => {
      let disabled = false;
      forward(event1, event2, { prefix: 'event-', except: 'disabled' });
      event2.once('event-disabled', () => { disabled = true; });
      event1.emit('disabled');
      expect(disabled, 'Forwarded disabled event').to.be.false;
    });
  });
});
