// FileForge — Size Calculator

(function () {
  'use strict';

  const inputs = {
    'bit': document.getElementById('inp-bit'),
    'b':   document.getElementById('inp-b'),
    'kb':  document.getElementById('inp-kb'),
    'mb':  document.getElementById('inp-mb'),
    'gb':  document.getElementById('inp-gb'),
    'tb':  document.getElementById('inp-tb'),
  };

  // Base unit is bytes for our calculations
  const multipliers = {
    'bit': 1 / 8,
    'b':   1,
    'kb':  1024,
    'mb':  1024 ** 2,
    'gb':  1024 ** 3,
    'tb':  1024 ** 4,
  };

  function updateValues(sourceId, value) {
    if (value === '' || isNaN(value)) {
      Object.keys(inputs).forEach(k => {
        if (k !== sourceId) inputs[k].value = '';
      });
      return;
    }

    const bytes = value * multipliers[sourceId];

    Object.keys(inputs).forEach(k => {
      if (k !== sourceId) {
        let val = bytes / multipliers[k];
        // Format nicely to avoid scientific notation for normal numbers, 
        // but avoid crazy long decimals
        if (val % 1 !== 0) {
          // Keep up to 6 decimal places but remove trailing zeros
          val = parseFloat(val.toFixed(6));
        }
        inputs[k].value = val;
      }
    });
  }

  Object.keys(inputs).forEach(k => {
    inputs[k].addEventListener('input', (e) => {
      updateValues(k, e.target.value);
    });
  });

})();
