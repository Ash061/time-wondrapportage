import { buildReport } from './core.js';

const locationInput = document.querySelector('#location');
const observedAtInput = document.querySelector('#observedAt');
const generateButton = document.querySelector('#generateButton');
const resetButton = document.querySelector('#resetButton');
const copyButton = document.querySelector('#copyButton');
const reportOutput = document.querySelector('#reportOutput');
const reportSection = document.querySelector('#reportSection');
const selectionStatus = document.querySelector('#selectionStatus');
const copyStatus = document.querySelector('#copyStatus');

function setDefaultDateTime() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  observedAtInput.value = local.toISOString().slice(0, 16);
}

function checkedValues(section) {
  return [...section.querySelectorAll('input:checked')].map((input) => input.value);
}

function detailValue(section) {
  return section.querySelector('textarea').value.trim();
}

function collectSections() {
  return {
    T: document.querySelector('[data-section="tissue"]'),
    I: document.querySelector('[data-section="infection"]'),
    M: document.querySelector('[data-section="moisture"]'),
    E: document.querySelector('[data-section="edge"]')
  };
}

function hasObservation() {
  return Object.values(collectSections()).some((section) => checkedValues(section).length || detailValue(section));
}

function updateStatus() {
  const count = Object.values(collectSections()).filter((section) => checkedValues(section).length || detailValue(section)).length;
  selectionStatus.textContent = count ? `${count} van 4 TIME-onderdelen ingevuld.` : 'Vul minimaal één observatie in.';
}

function generateReport() {
  if (!hasObservation()) {
    selectionStatus.textContent = 'Kies of beschrijf eerst minimaal één observatie.';
    document.querySelector('[data-section="tissue"]').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const sections = Object.fromEntries(
    Object.entries(collectSections()).map(([key, section]) => [key, {
      values: checkedValues(section),
      detail: detailValue(section)
    }])
  );
  reportOutput.value = buildReport({
    location: locationInput.value,
    observedAt: observedAtInput.value,
    sections
  });
  copyButton.disabled = false;
  copyStatus.textContent = 'Concept gemaakt. Controleer de tekst vóór het kopiëren.';
  reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  reportOutput.focus({ preventScroll: true });
}

async function copyReport() {
  const text = reportOutput.value.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    reportOutput.select();
    document.execCommand('copy');
    reportOutput.setSelectionRange(text.length, text.length);
  }
  copyStatus.textContent = 'Rapportage gekopieerd.';
  const original = copyButton.innerHTML;
  copyButton.textContent = 'Gekopieerd';
  window.setTimeout(() => { copyButton.innerHTML = original; }, 1500);
}

function resetForm() {
  const hasContent = locationInput.value.trim() || hasObservation() || reportOutput.value.trim();
  if (hasContent && !window.confirm('Alle ingevulde observaties en de rapportage wissen?')) return;
  document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach((input) => { input.checked = false; });
  moistureColors.forEach((input) => { input.disabled = false; });
  document.querySelectorAll('textarea').forEach((textarea) => { textarea.value = ''; });
  locationInput.value = '';
  setDefaultDateTime();
  copyButton.disabled = true;
  copyStatus.textContent = '';
  updateStatus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  locationInput.focus({ preventScroll: true });
}

document.querySelectorAll('[data-section="infection"] input[type="checkbox"]').forEach((input) => {
  input.addEventListener('change', () => {
    const infectionCard = document.querySelector('[data-section="infection"]');
    const exclusive = infectionCard.querySelector('[data-exclusive="true"]');
    if (input === exclusive && input.checked) {
      infectionCard.querySelectorAll('input[type="checkbox"]:not([data-exclusive="true"])').forEach((item) => { item.checked = false; });
    } else if (input.checked) {
      exclusive.checked = false;
    }
  });
});

const dryInput = document.querySelector('[data-section="moisture"] input[value="de wond is droog"]');
const moistureColors = [...document.querySelectorAll('[data-section="moisture"] input[type="checkbox"]')];
document.querySelectorAll('[data-section="moisture"] input[name="moisture-amount"]').forEach((input) => {
  input.addEventListener('change', () => {
    const isDry = dryInput.checked;
    moistureColors.forEach((color) => {
      if (isDry) color.checked = false;
      color.disabled = isDry;
    });
  });
});

document.querySelectorAll('input, textarea').forEach((control) => {
  control.addEventListener('input', updateStatus);
  control.addEventListener('change', updateStatus);
});

reportOutput.addEventListener('input', () => {
  copyButton.disabled = !reportOutput.value.trim();
  copyStatus.textContent = reportOutput.value.trim() ? 'Tekst aangepast.' : '';
});

generateButton.addEventListener('click', generateReport);
copyButton.addEventListener('click', copyReport);
resetButton.addEventListener('click', resetForm);

setDefaultDateTime();
updateStatus();
