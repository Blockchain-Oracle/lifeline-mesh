// Lifeline Mesh — Case Console behaviour. Wires the designer's UI to the real
// junior-node API (/api/case, /api/referral, /api/mesh). Vanilla, served as a
// static asset (no build step); the designer's production app can replace it.
(() => {
  const $ = (id) => document.getElementById(id);
  const SEVERE = new Set([
    "VERY SEVERE DISEASE",
    "SEVERE PNEUMONIA OR VERY SEVERE DISEASE",
    "VERY SEVERE FEBRILE DISEASE",
    "SEVERE DEHYDRATION",
    "MASTOIDITIS",
    "SEVERE ACUTE MALNUTRITION",
  ]);
  let lastCase = null;
  let lastCitation = null;

  async function refreshMesh() {
    try {
      const m = await (await fetch("/api/mesh")).json();
      const pill = $("meshPill");
      const linked = m.status === "linked";
      pill.className = "pill " + (linked ? "linked" : "alone");
      $("meshPillText").textContent = linked ? "Linked to supervisor" : "Working alone";
    } catch {
      /* offline pill stays */
    }
  }

  function showSheet(scrim, sheet) {
    scrim.hidden = false;
    sheet.hidden = false;
  }
  function hideSheet(scrim, sheet) {
    scrim.hidden = true;
    sheet.hidden = true;
  }

  function renderVerdict(data) {
    const c = data.case;
    const severe = SEVERE.has(c.classification);
    const card = $("verdictCard");
    card.style.background = severe ? "var(--danger-bg)" : "oklch(0.97 0.02 190)";
    card.style.borderColor = severe ? "var(--danger-br)" : "oklch(0.82 0.05 190)";
    const ink = severe ? "var(--danger-ink)" : "var(--teal-ink)";
    $("verdictDot").style.background = severe ? "var(--danger)" : "var(--teal)";
    $("verdictDot").textContent = severe ? "!" : "✓";
    $("verdictTag").style.color = ink;
    $("verdictTag").textContent = severe ? "URGENT — REFER" : "ASSESSED";
    $("verdictTitle").style.color = ink;
    $("verdictTitle").textContent = c.classification;
    $("verdictAction").style.color = severe ? "oklch(0.3 0.05 35)" : "oklch(0.3 0.03 190)";
    $("verdictAction").textContent = c.rationale;

    lastCitation = data.classificationCitation;
    if (lastCitation) {
      $("verdictCite").hidden = false;
      $("verdictCite").style.background = severe ? "oklch(0.94 0.035 36)" : "var(--teal-bg)";
      $("verdictCite").style.color = ink;
      $("verdictCiteText").textContent = lastCitation.label.replace("WHO ", "");
    } else {
      $("verdictCite").hidden = true;
    }

    // Escalation messaging
    const esc = data.route.escalation;
    $("aloneNote").hidden = !(esc.escalate && data.route.escalatedButLocal);
  }

  async function runMeshThenVerdict(data) {
    const esc = data.route.escalation;
    const linkedEscalate = esc.escalate && data.route.target === "senior-delegated";
    if (linkedEscalate) {
      $("meshCard").hidden = false;
      $("meshTag").textContent = "reaching…";
      await new Promise((r) => setTimeout(r, 2200));
      $("meshBody").innerHTML =
        '<p style="margin:0;font-size:15px;font-weight:700;color:oklch(0.34 0.04 262);">✓ Senior reading received</p>' +
        '<p style="margin:0;font-size:13.5px;line-height:1.45;color:var(--indigo-ink);">Reviewed on the supervisor\'s MedPsy-4B, device to device.</p>';
      $("meshTag").textContent = "replied";
      $("meshPacket").style.display = "none";
    }
    renderVerdict(data);
    $("verdictWrap").hidden = false;
    $("talkDock").hidden = true;
    $("verdictDock").hidden = false;
  }

  async function assess() {
    const utterance = $("utterance").value.trim();
    const ageMonths = Number($("age").value);
    if (!utterance) return;
    $("hero").hidden = true;
    $("intakeText").textContent = '"' + utterance + '"';
    $("intake").hidden = false;
    $("assess").disabled = true;
    $("talkLabel").textContent = "Understanding…";
    try {
      const data = await (
        await fetch("/api/case", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ utterance, ageMonths, sex: "unknown" }),
        })
      ).json();
      lastCase = data.case;
      await runMeshThenVerdict(data);
    } catch (e) {
      $("talkLabel").textContent = "Something went wrong — try again";
      $("assess").disabled = false;
    }
  }

  function openSource() {
    if (!lastCitation) return;
    $("sourceLabel").textContent = lastCitation.label;
    $("sourceQuote").textContent = lastCitation.quote || "(quote unavailable)";
    showSheet($("sourceScrim"), $("sourceSheet"));
  }

  async function referral() {
    if (!lastCase) return;
    $("refer").disabled = true;
    $("refer").textContent = "Writing…";
    try {
      const d = await (
        await fetch("/api/referral", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            case: lastCase,
            ageMonths: Number($("age").value),
            sex: "unknown",
            dateIso: new Date().toISOString().slice(0, 10),
          }),
        })
      ).json();
      const pretty = (d.markdown || "(no referral generated)")
        .replace(/^#+\s*/gm, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/^---$/gm, "—");
      $("refText").textContent = pretty;
      const severe = Boolean(lastCase && SEVERE.has(lastCase.classification));
      $("refUrgency").textContent = severe ? "URGENT" : "REFERRAL";
      showSheet($("refScrim"), $("refSheet"));
    } finally {
      $("refer").disabled = false;
      $("refer").textContent = "Write referral note";
    }
  }

  function resetCase() {
    lastCase = null;
    lastCitation = null;
    $("verdictWrap").hidden = true;
    $("intake").hidden = true;
    $("meshCard").hidden = true;
    $("verdictDock").hidden = true;
    $("talkDock").hidden = false;
    $("hero").hidden = false;
    $("assess").disabled = false;
    $("talkLabel").textContent = "Tap to assess";
  }

  $("assess").addEventListener("click", assess);
  $("refer").addEventListener("click", referral);
  $("newCase").addEventListener("click", resetCase);
  $("verdictCite").addEventListener("click", openSource);
  $("sourceClose").addEventListener("click", () => hideSheet($("sourceScrim"), $("sourceSheet")));
  $("sourceScrim").addEventListener("click", () => hideSheet($("sourceScrim"), $("sourceSheet")));
  $("refClose").addEventListener("click", () => hideSheet($("refScrim"), $("refSheet")));
  $("refScrim").addEventListener("click", () => hideSheet($("refScrim"), $("refSheet")));

  refreshMesh();
  setInterval(refreshMesh, 10000);
})();
