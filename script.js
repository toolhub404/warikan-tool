let members = JSON.parse(localStorage.getItem("members")) || [];
let payments = JSON.parse(localStorage.getItem("payments")) || [];

function saveData() {
  localStorage.setItem("members", JSON.stringify(members));
  localStorage.setItem("payments", JSON.stringify(payments));
}

function addMember() {
  const name = document.getElementById("memberName").value.trim();
  if (!name) return;

  if (!members.includes(name)) {
    members.push(name);
  }

  document.getElementById("memberName").value = "";
  saveData();
  render();
}

function addPayment() {
  const payer = document.getElementById("payer").value;
  const amount = Number(document.getElementById("amount").value);
  const targets = [...document.querySelectorAll(".target:checked")].map(x => x.value);

  if (!payer || !amount || targets.length === 0) {
    alert("払った人・金額・対象メンバーを入力してください");
    return;
  }

  payments.push({ payer, amount, targets });
  document.getElementById("amount").value = "";

  saveData();
  render();
}

function calculate() {
  const balance = {};
  members.forEach(m => balance[m] = 0);

  payments.forEach(p => {
    const share = p.amount / p.targets.length;
    balance[p.payer] += p.amount;

    p.targets.forEach(t => {
      balance[t] -= share;
    });
  });

  const creditors = [];
  const debtors = [];

  for (const name in balance) {
    const value = Math.round(balance[name]);
    if (value > 0) creditors.push({ name, amount: value });
    if (value < 0) debtors.push({ name, amount: -value });
  }

  const results = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);

    results.push(`${debtors[i].name} → ${creditors[j].name}：${pay}円`);

    debtors[i].amount -= pay;
    creditors[j].amount -= pay;

    if (debtors[i].amount === 0) i++;
    if (creditors[j].amount === 0) j++;
  }

  return results;
}

function render() {
  const memberList = document.getElementById("memberList");
  const payer = document.getElementById("payer");
  const targetMembers = document.getElementById("targetMembers");
  const resultList = document.getElementById("resultList");

  memberList.innerHTML = "";
  payer.innerHTML = "";
  targetMembers.innerHTML = "";
  resultList.innerHTML = "";

  members.forEach(m => {
    memberList.innerHTML += `<li>${m}</li>`;
    payer.innerHTML += `<option value="${m}">${m}</option>`;
    targetMembers.innerHTML += `
      <label class="member-check">
        <input class="target" type="checkbox" value="${m}" checked>
        ${m}
      </label>
    `;
  });

  calculate().forEach(r => {
    resultList.innerHTML += `<li>${r}</li>`;
  });
}

function exportCSV() {
  let csv = "type,payer,amount,targets\n";

  payments.forEach(p => {
    csv += `payment,${p.payer},${p.amount},"${p.targets.join("|")}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "warikan-data.csv";
  a.click();
}

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    const lines = e.target.result.split("\n").slice(1);
    payments = [];

    lines.forEach(line => {
      if (!line.trim()) return;

      const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      if (!cols) return;

      const payer = cols[1];
      const amount = Number(cols[2]);
      const targets = cols[3].replaceAll('"', "").split("|");

      payments.push({ payer, amount, targets });
    });

    saveData();
    render();
  };

  reader.readAsText(file);
}

function clearAll() {
  if (!confirm("全データを削除しますか？")) return;

  members = [];
  payments = [];
  saveData();
  render();
}

render();
