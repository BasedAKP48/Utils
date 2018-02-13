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
      expect(event1.emit('event')).to.be.true;
      expect(forwarded).to.be.true;
      expect(event).to.be.false;
    });
    it('should not be forwarded', () => {
      let disabled = false;
      forward(event1, event2, ['disabled']);
      event2.once('disabled', () => { disabled = true; });
      expect(event1.emit('disabled')).to.be.false;
      expect(disabled).to.be.false;
    });
    it('should still work when prefix and except are passed', () => {
      let enabled = false;
      let disabled = false;
      forward(event1, event2, { prefix: 'event-', except: ['disabled'] });
      event2.once('event-enabled', () => { enabled = true; });
      event2.once('event-disabled', () => { disabled = true; });
      expect(event1.emit('enabled')).to.be.true;
      expect(event1.emit('disabled')).to.be.false;
      expect(enabled).to.be.true;
      expect(disabled).to.be.false;
    });
    it('should allow except to be a string', () => {
      let disabled = false;
      forward(event1, event2, { prefix: 'event-', except: 'disabled' });
      event2.once('event-disabled', () => { disabled = true; });
      expect(event1.emit('disabled')).to.be.false;
      expect(disabled).to.be.false;
    });
  });
});
