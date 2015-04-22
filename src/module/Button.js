+(function (factory) {
  if (typeof exports === 'undefined') {
    factory(webduino || {});
  } else {
    module.exports = factory;
  }
}(function (scope) {
  'use strict';

  var PinEvent = scope.PinEvent,
    Pin = scope.Pin,
    Module = scope.Module;

  var ButtonEvent = {
    PRESS: "pressed",
    RELEASE: "released",
    LONG_PRESS: "longPress",
    SUSTAINED_PRESS: "sustainedPress"
  };

  function Button(board, pin, buttonMode, sustainedPressInterval) {
    Module.call(this);

    this._board = board;
    this._pin = pin;
    this._repeatCount = 0;
    this._timer = null;
    this._timeout = null;

    this._buttonMode = buttonMode || Button.PULL_DOWN;
    this._sustainedPressInterval = sustainedPressInterval || 1000;
    this._debounceInterval = 8;

    board.setDigitalPinMode(pin.number, Pin.DIN);

    if (this._buttonMode === Button.INTERNAL_PULL_UP) {
      board.enablePullUp(pin.number);
      this._pin.value = Pin.HIGH;
    } else if (this._buttonMode === Button.PULL_UP) {
      this._pin.value = Pin.HIGH;
    }

    this._pin.on(PinEvent.CHANGE, onPinChange.bind(this));
  }

  function onPinChange(pin) {
    var btnVal = pin.value;
    var stateHandler;

    if (this._buttonMode === Button.PULL_DOWN) {
      if (btnVal === 1) {
        stateHandler = onPress.bind(this);
      } else {
        stateHandler = onRelease.bind(this);
      }
    } else if (this._buttonMode === Button.PULL_UP || this._buttonMode === Button.INTERNAL_PULL_UP) {
      if (btnVal === 1) {
        stateHandler = onRelease.bind(this);
      } else {
        stateHandler = onPress.bind(this);
      }
    }

    if (this._timeout === null) {
      this._timeout = setTimeout(stateHandler, this._debounceInterval);
    } else {
      clearTimeout(this._timeout);
      this._timeout = setTimeout(stateHandler, this._debounceInterval);
    }
  }

  function onPress() {
    this._timeout = null;
    this.emit(ButtonEvent.PRESS);
    this._timer = setInterval(onSustainedPress.bind(this), this._sustainedPressInterval);
  }

  function onRelease() {
    this._timeout = null;
    this.emit(ButtonEvent.RELEASE);

    if (this._timer !== null) {
      clearInterval(this._timer);
      delete this._timer;
    }

    this._repeatCount = 0;
  }

  function onSustainedPress() {
    if (this._repeatCount > 0) {
      this.emit(ButtonEvent.SUSTAINED_PRESS);
    } else {
      this.emit(ButtonEvent.LONG_PRESS);
    }
    this._repeatCount++;
  }

  Button.prototype = Object.create(Module.prototype, {

    constructor: {
      value: Button
    },

    buttonMode: {
      get: function () {
        return this._buttonMode;
      }
    },

    sustainedPressInterval: {
      get: function () {
        return this._sustainedPressInterval;
      },
      set: function (intervalTime) {
        this._sustainedPressInterval = intervalTime;
      }
    }

  });

  Button.PULL_DOWN = 0;
  Button.PULL_UP = 1;
  Button.INTERNAL_PULL_UP = 2;

  scope.module.ButtonEvent = ButtonEvent;
  scope.module.Button = Button;
}));