// FileForge — Password Generator Tool

(function () {
  'use strict';

  const pwdResult   = document.getElementById('pwdResult');
  const copyBtn     = document.getElementById('copyBtn');
  const generateBtn = document.getElementById('generateBtn');
  const strengthText= document.getElementById('strengthText');
  const strengthFill= document.getElementById('strengthFill');
  
  const pwdLength   = document.getElementById('pwdLength');
  const pwdLengthVal= document.getElementById('pwdLengthVal');
  const chkUpper    = document.getElementById('chkUpper');
  const chkLower    = document.getElementById('chkLower');
  const chkNum      = document.getElementById('chkNum');
  const chkSym      = document.getElementById('chkSym');

  const chars = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    num: '0123456789',
    sym: '!@#$%^&*()_+~`|}{[]:;?><,./-='
  };

  function generatePassword() {
    const len = parseInt(pwdLength.value);
    let charset = '';
    
    if (chkUpper.checked) charset += chars.upper;
    if (chkLower.checked) charset += chars.lower;
    if (chkNum.checked) charset += chars.num;
    if (chkSym.checked) charset += chars.sym;

    if (charset === '') {
      pwdResult.textContent = 'Select options';
      pwdResult.style.color = 'var(--error)';
      updateStrength(0);
      return;
    }

    pwdResult.style.color = 'var(--text)';
    
    // Secure random generation using crypto
    const randomArray = new Uint32Array(len);
    window.crypto.getRandomValues(randomArray);
    
    let result = '';
    for (let i = 0; i < len; i++) {
      result += charset[randomArray[i] % charset.length];
    }

    // Ensure at least one character from each selected pool is included
    // (This guarantees the password meets the selected criteria)
    let guaranteed = [];
    if (chkUpper.checked) guaranteed.push(chars.upper[Math.floor(Math.random() * chars.upper.length)]);
    if (chkLower.checked) guaranteed.push(chars.lower[Math.floor(Math.random() * chars.lower.length)]);
    if (chkNum.checked) guaranteed.push(chars.num[Math.floor(Math.random() * chars.num.length)]);
    if (chkSym.checked) guaranteed.push(chars.sym[Math.floor(Math.random() * chars.sym.length)]);
    
    // Replace first few characters with guaranteed ones, then shuffle
    let resultArray = result.split('');
    for (let i = 0; i < guaranteed.length; i++) {
      resultArray[i] = guaranteed[i];
    }
    
    // Shuffle array (Fisher-Yates)
    for (let i = resultArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [resultArray[i], resultArray[j]] = [resultArray[j], resultArray[i]];
    }
    
    const finalPwd = resultArray.join('');
    pwdResult.textContent = finalPwd;
    
    calculateStrength(finalPwd);
  }

  function calculateStrength(pwd) {
    let score = 0;
    if (!pwd || pwd === 'Select options') return updateStrength(0);
    
    // Length
    if (pwd.length > 8) score += 1;
    if (pwd.length > 12) score += 1;
    if (pwd.length >= 16) score += 1;
    
    // Character types
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    
    updateStrength(score);
  }

  function updateStrength(score) {
    // max score is 7
    if (score <= 2) {
      strengthText.textContent = 'Weak';
      strengthText.style.color = '#ef4444';
      strengthFill.style.width = '33%';
      strengthFill.style.background = '#ef4444';
    } else if (score <= 5) {
      strengthText.textContent = 'Good';
      strengthText.style.color = '#f59e0b';
      strengthFill.style.width = '66%';
      strengthFill.style.background = '#f59e0b';
    } else {
      strengthText.textContent = 'Strong';
      strengthText.style.color = '#10b981';
      strengthFill.style.width = '100%';
      strengthFill.style.background = '#10b981';
    }
  }

  // Event Listeners
  pwdLength.addEventListener('input', (e) => {
    pwdLengthVal.value = e.target.value;
    generatePassword();
  });
  
  [chkUpper, chkLower, chkNum, chkSym].forEach(chk => {
    chk.addEventListener('change', generatePassword);
  });
  
  generateBtn.addEventListener('click', generatePassword);

  copyBtn.addEventListener('click', async () => {
    const text = pwdResult.textContent;
    if (text === 'Select options') return;
    
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = '✅ Copied!';
      setTimeout(() => copyBtn.textContent = '📋 Copy', 2000);
      showToast('Password copied to clipboard', 'success');
    } catch (e) {
      showToast('Failed to copy', 'error');
    }
  });

  // Initialize
  generatePassword();

})();
