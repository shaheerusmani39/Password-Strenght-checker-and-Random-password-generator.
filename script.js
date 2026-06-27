// ── Character pools for password generation ───────────────
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMS  = '0123456789';
const SPEC  = '!@#$%^&*()-_=+[]{}|;:,.<>?';

// Stores the last generated password so "Use this" can apply it
let lastGenerated = '';

// ── Update the length label next to the slider ────────────
function updateLen() {
  document.getElementById('lenVal').textContent =
    document.getElementById('lenSlider').value;
}

// ── Generate a cryptographically random strong password ───
function generate() {
  const len  = parseInt(document.getElementById('lenSlider').value);
  const pool = UPPER + LOWER + NUMS + SPEC;
  let pwd = [];

  // Guarantee at least one character from each required category
  pwd.push(UPPER[rand(UPPER.length)]);
  pwd.push(LOWER[rand(LOWER.length)]);
  pwd.push(NUMS[rand(NUMS.length)]);
  pwd.push(SPEC[rand(SPEC.length)]);

  // Fill the remaining length from the full pool
  for (let i = 4; i < len; i++) {
    pwd.push(pool[rand(pool.length)]);
  }

  // Fisher-Yates shuffle so guaranteed chars aren't always at the front
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }

  lastGenerated = pwd.join('');
  document.getElementById('genOut').textContent = lastGenerated;

  // Reset copy button label
  document.getElementById('copyBtn').textContent = 'COPY';
  document.getElementById('copyBtn').classList.remove('copied');
}

// ── Cryptographically secure random integer in [0, max) ──
function rand(max) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

// ── Copy the generated password to clipboard ──────────────
function copyGen() {
  if (!lastGenerated) return;
  navigator.clipboard.writeText(lastGenerated).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✓ DONE';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'COPY';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// ── Load the generated password into the checker input ────
function useGenerated() {
  // Auto-generate if nothing has been generated yet
  if (!lastGenerated) generate();

  const input = document.getElementById('pwd');
  input.value = lastGenerated;
  input.type  = 'text';
  document.getElementById('showBtn').textContent = 'HIDE';

  analyze();
  input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Toggle password visibility ────────────────────────────
function toggleShow() {
  const p = document.getElementById('pwd');
  const b = document.getElementById('showBtn');
  if (p.type === 'password') {
    p.type = 'text';
    b.textContent = 'HIDE';
  } else {
    p.type = 'password';
    b.textContent = 'SHOW';
  }
}

// ── Analyze password and update the UI ────────────────────
function analyze() {
  const val = document.getElementById('pwd').value;

  // Run all criteria checks
  const checks = {
    len:   val.length >= 8,
    upper: /[A-Z]/.test(val),
    lower: /[a-z]/.test(val),
    num:   /[0-9]/.test(val),
    spec:  /[^A-Za-z0-9]/.test(val),
    long:  val.length >= 12
  };

  // Update each criteria dot
  ['len', 'upper', 'lower', 'num', 'spec', 'long'].forEach(k => {
    document.getElementById('c-' + k).classList.toggle('met', checks[k]);
  });

  // Count how many criteria are met (max 6)
  const score = Object.values(checks).filter(Boolean).length;

  const bars = ['b1', 'b2', 'b3', 'b4'];
  const lbl  = document.getElementById('strengthLabel');

  // Reset bars and label
  bars.forEach(id => { document.getElementById(id).className = 'bar-seg'; });
  lbl.className = 'strength-label';

  // If input is empty, clear everything and exit
  if (!val) {
    lbl.textContent = '';
    buildSuggestions(checks, val);
    return;
  }

  // Determine strength class and label text
  let cls, text;
  if (score <= 2)      { cls = 'weak';        text = 'Weak Password'; }
  else if (score <= 3) { cls = 'medium';      text = 'Medium Password'; }
  else if (score <= 5) { cls = 'strong';      text = 'Strong Password'; }
  else                 { cls = 'very-strong'; text = 'Very Strong Password'; }

  // Fill the right number of bar segments
  const fill = { weak: 1, medium: 2, strong: 3, 'very-strong': 4 }[cls];
  for (let i = 0; i < fill; i++) {
    document.getElementById(bars[i]).classList.add(cls);
  }

  lbl.classList.add(cls);
  lbl.textContent = text;

  buildSuggestions(checks, val);
}

// ── Build the suggestions list based on unmet criteria ────
function buildSuggestions(checks, val) {
  const box  = document.getElementById('sugBox');
  const list = document.getElementById('sugList');

  if (!val) {
    box.style.display = 'none';
    return;
  }

  const items = [];
  if (!checks.len)   items.push('Use at least 8 characters');
  if (!checks.upper) items.push('Add an uppercase letter (A–Z)');
  if (!checks.lower) items.push('Add a lowercase letter (a–z)');
  if (!checks.num)   items.push('Include at least one number');
  if (!checks.spec)  items.push('Add a special character (!, @, #, $…)');
  if (!checks.long)  items.push('Aim for 12+ characters for better security');

  if (!items.length) items.push('Great job! Your password is very secure.');

  list.innerHTML = items
    .map(t => `<div class="sug-item">${t}</div>`)
    .join('');

  box.style.display = 'block';
}

// ── Copy the manually typed password to clipboard ─────────
function copyPwd() {
  const val = document.getElementById('pwd').value;
  if (!val) return;
  navigator.clipboard.writeText(val);
}

// ── Clear everything and start fresh ──────────────────────
function reset() {
  const p = document.getElementById('pwd');
  p.value = '';
  p.type  = 'password';
  document.getElementById('showBtn').textContent = 'SHOW';
  analyze();
}
