// Petit store local basé sur localStorage
const PAYMENTS_KEY = "bmvt.payments";      // transactions (historique paiements)
const VERSEMENTS_KEY = "bmvt.versements";  // versements (acomptes)

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ======== Paiements (transactions) ========
export function getPayments() {
  return read(PAYMENTS_KEY);
}
export function addPayment(p) {
  const list = getPayments();
  list.unshift(p); // le plus récent en premier
  write(PAYMENTS_KEY, list);
}

// ======== Versements (acomptes / restes) ========
export function getVersements() {
  return read(VERSEMENTS_KEY);
}
export function addVersement(v) {
  const list = getVersements();
  list.unshift(v);
  write(VERSEMENTS_KEY, list);
}

// ======== Référence auto PMT-YYYYMM-#### ========
export function generatePaymentRef() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const seq = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  return `PMT-${y}${m}-${seq}`;
}
