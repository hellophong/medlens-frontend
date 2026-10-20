/* =====================================================================
   MedLens capsule avatar — behaviour
   Source: the "COPY TO MEDLENS (3 of 3)" block of the reference demo.

   Contains only the five avatar functions. Nothing marked DEMO ONLY in
   the reference (fakeFetch, KNOWN, distance, the preview buttons, the
   demo search form) is copied here.

   Loaded before the main inline script, so these are available on the
   global scope when index.html wires them to the real search flow.
   ===================================================================== */

function createMedLensAvatar(root) {
  const bubble = root.querySelector('.ml-bubble');
  const textEl = root.querySelector('.ml-bubble-text');
  const pupils = root.querySelectorAll('.ml-pupil');
  let slowTimer = null, hideTimer = null, beatTimer = null;

  function say(text, holdMs) {
    clearTimeout(hideTimer);
    textEl.textContent = text;
    bubble.classList.add('is-visible');
    if (holdMs) hideTimer = setTimeout(hush, holdMs);
  }
  function hush() { bubble.classList.remove('is-visible'); }

  function setState(state, text, holdMs) {
    clearTimeout(slowTimer);
    root.dataset.state = state;
    if (text) say(text, holdMs); else hush();
    if (state === 'thinking') {
      slowTimer = setTimeout(() => say(
        "Still looking. The server naps when it's quiet, so the first search can take up to a minute."
      ), 6000);
    }
  }

  // Eyes follow the cursor (and touch), clamped to a small range.
  function lookAt(clientX, clientY) {
    const r = root.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = Math.max(-3, Math.min(3, (clientX - cx) / 60));
    const dy = Math.max(-3, Math.min(3, (clientY - cy) / 60));
    pupils.forEach(p => { p.style.setProperty('--ml-px', dx + 'px'); p.style.setProperty('--ml-py', dy + 'px'); });
  }
  window.addEventListener('pointermove', e => lookAt(e.clientX, e.clientY), { passive: true });

  // Personality beat: a little stretch every so often while idle.
  function scheduleBeat() {
    clearTimeout(beatTimer);
    beatTimer = setTimeout(() => {
      if (root.dataset.state === 'idle') {
        root.classList.add('ml-beat');
        setTimeout(() => root.classList.remove('ml-beat'), 1200);
      }
      scheduleBeat();
    }, 6000 + Math.random() * 6000);
  }
  scheduleBeat();

  return { setState, say, hush, get state() { return root.dataset.state; } };
}

function attachAvatarToSearch(avatar, input) {
  input.addEventListener('input', () => {
    if (avatar.state === 'thinking') return;
    if (input.value.trim()) {
      if (avatar.state !== 'attentive') avatar.setState('attentive');
    } else {
      avatar.setState('idle');
    }
  });
}

const ML_FILLER = new Set(('what are is the of side effects tell me about can i take for a an does do how much ' +
  'should safe kids children my to it info on information use used dose dosage interactions interact mix ' +
  'mixing together combine while pregnant with and or vs').split(' '));
function extractDrug(raw) {
  const words = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
  const kept = words.filter(w => !ML_FILLER.has(w));
  return kept[0] || '';
}

const ML_CAUTION = /\b(with|and|mix|mixing|together|combine|dose|dosage|how much|interact|interactions|pregnant|kids|children)\b/i;
function answerLine(drugName, rawQuery) {
  if (ML_CAUTION.test(rawQuery)) {
    return `Here's what I found on ${drugName}. Questions about mixing, dosing, or who can take it are best answered by a pharmacist or doctor, so please check with one first.`;
  }
  return `Here's what I found on ${drugName}. Before you change anything, check with your doctor or pharmacist.`;
}
function notFoundLine(query, suggestion) {
  return suggestion
    ? `I couldn't find "${query}". Did you mean ${suggestion}?`
    : `I couldn't find "${query}". Check the spelling or try the generic name.`;
}
