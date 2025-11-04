const TWO_DAYS_SECONDS = 2 * 24 * 60 * 60;

const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const uploadBtn = document.getElementById("uploadBtn");
const clearBtn = document.getElementById("clearBtn");
const status = document.getElementById("status");
const result = document.getElementById("result");
const directUrl = document.getElementById("directUrl");
const copyBtn = document.getElementById("copyBtn");
const openBtn = document.getElementById("openBtn");
const uploadsList = document.getElementById("uploadsList");
const cleanupAll = document.getElementById("cleanupAll");
const purgeLocal = document.getElementById("purgeLocal");
const lifetimeSelect = document.getElementById("lifetime");

let currentFile = null;

function fmtDate(ts) {
  return new Date(ts).toLocaleString();
}

function loadLocalIndex() {
  try {
    const raw = localStorage.getItem("ephemeral_uploads");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveLocalIndex(list) {
  localStorage.setItem("ephemeral_uploads", JSON.stringify(list));
}

function addLocalRecord(record) {
  const list = loadLocalIndex();
  list.unshift(record);
  saveLocalIndex(list);
  renderUploads();
}

function renderUploads() {
  const list = loadLocalIndex();
  uploadsList.innerHTML = "";
  if (list.length === 0) {
    uploadsList.innerHTML = "<li class='muted small'>No uploads yet</li>";
    return;
  }
  list.forEach((r, i) => {
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.innerHTML = `<strong>${escapeHtml(r.name)}</strong><div class="small muted">expires: ${fmtDate(r.expiresAt)}</div><div class="small muted">uploaded: ${fmtDate(r.uploadedAt)}</div>`;
    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.gap = "8px";
    const open = document.createElement("a");
    open.href = r.url;
    open.target = "_blank";
    open.textContent = "Open";
    open.className = "ghost";
    const copy = document.createElement("button");
    copy.textContent = "Copy";
    copy.onclick = () => navigator.clipboard.writeText(r.url).then(() => alert("Copied"));
    const attempt = document.createElement("button");
    attempt.textContent = "Cleanup";
    attempt.className = "ghost";
    attempt.onclick = async () => {
      attempt.disabled = true;
      await attemptDeleteRecord(r, i);
      attempt.disabled = false;
    };
    right.appendChild(open);
    right.appendChild(copy);
    right.appendChild(attempt);
    li.appendChild(left);
    li.appendChild(right);
    uploadsList.appendChild(li);
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

fileInput.addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  currentFile = f || null;
  fileName.textContent = f ? `${f.name} (${Math.round(f.size / 1024)} KB)` : "No file chosen";
});

clearBtn.addEventListener("click", () => {
  fileInput.value = "";
  currentFile = null;
  fileName.textContent = "No file chosen";
  status.textContent = "";
  result.hidden = true;
});

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(directUrl.value).then(() => {
    status.textContent = "Copied link to clipboard";
    setTimeout(() => status.textContent = "", 1500);
  });
});

uploadBtn.addEventListener("click", async () => {
  if (!currentFile) {
    status.textContent = "Choose a file first";
    return;
  }
  uploadBtn.disabled = true;
  status.textContent = "Uploading...";
  try {
    // compute expiry
    const days = parseInt(lifetimeSelect.value || "2", 10);
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + days * 24 * 60 * 60;

    // We use window.websim.upload (provided in environment) to upload file and get a public URL.
    // We include an "expires_at" field in metadata so the backend/storage can pick it up if supported.
    const options = {
      // metadata object is optional — providers may or may not store it.
      metadata: {
        ephemeral: "true",
        expires_at: expiresAt.toString(),
      },
    };

    // websim.upload returns the public URL of the uploaded blob (see environment).
    if (!window.websim || typeof window.websim.upload !== "function") {
      throw new Error("Upload API (websim.upload) is not available in this environment.");
    }

    const url = await window.websim.upload(currentFile, options);

    // Create a direct-download URL variant:
    // Many providers already return a direct URL that downloads the file.
    // If the returned url supports query params for forcing download we append `?download=1` conservatively.
    const direct = url.includes("?") ? `${url}&download=1` : `${url}?download=1`;

    // show result
    directUrl.value = direct;
    openBtn.href = direct;
    result.hidden = false;
    status.textContent = "Upload complete";

    // store local record for management UI
    addLocalRecord({
      name: currentFile.name,
      url: direct,
      uploadedAt: Date.now(),
      expiresAt: expiresAt * 1000,
      rawUrl: url,
    });
  } catch (err) {
    console.error(err);
    status.textContent = "Upload failed: " + (err.message || err);
  } finally {
    uploadBtn.disabled = false;
  }
});

async function attemptDeleteRecord(record, index) {
  status.textContent = `Attempting to delete ${record.name} ...`;
  // Some hosting environments expose websim.delete or websim.remove — try them.
  try {
    if (window.websim && typeof window.websim.delete === "function") {
      await window.websim.delete(record.rawUrl);
      status.textContent = "Deleted (via websim.delete)";
    } else if (window.websim && typeof window.websim.remove === "function") {
      await window.websim.remove(record.rawUrl);
      status.textContent = "Deleted (via websim.remove)";
    } else {
      // If no delete API available, we mark as expired locally so UI removes it later.
      status.textContent = "No remote delete API available; marked locally as expired.";
    }
  } catch (err) {
    console.warn("delete failed", err);
    status.textContent = "Delete attempt failed: " + (err.message || err);
  } finally {
    // Remove the record from local index (regardless of remote result) if it's expired or user requested cleanup
    const list = loadLocalIndex();
    // remove the exact matching url entry
    const newList = list.filter((r) => r.url !== record.url);
    saveLocalIndex(newList);
    renderUploads();
    setTimeout(() => status.textContent = "", 2000);
  }
}

cleanupAll.addEventListener("click", async () => {
  const list = loadLocalIndex();
  if (list.length === 0) {
    status.textContent = "No uploads to process";
    return;
  }
  cleanupAll.disabled = true;
  status.textContent = "Running cleanup attempts...";
  for (const r of list) {
    // attempt delete for items past expiry
    if (Date.now() >= r.expiresAt) {
      // we call attemptDeleteRecord but it removes entry from local list
      // wrap to avoid stopping on errors
      try { await attemptDeleteRecord(r); } catch (e) { console.warn(e); }
    }
  }
  status.textContent = "Cleanup complete (local index updated)";
  cleanupAll.disabled = false;
  setTimeout(() => status.textContent = "", 2000);
});

purgeLocal.addEventListener("click", () => {
  if (!confirm("Remove all local upload records? This does not delete remote files.")) return;
  localStorage.removeItem("ephemeral_uploads");
  renderUploads();
});

function removeExpiredRecordsOnLoad() {
  const list = loadLocalIndex();
  const now = Date.now();
  const keep = list.filter((r) => r.expiresAt > now);
  if (keep.length !== list.length) saveLocalIndex(keep);
}

// initial render
removeExpiredRecordsOnLoad();
renderUploads();

// Utility: small safeguard in case environment doesn't provide websim
if (!window.websim) {
  window.websim = {
    // noop upload that throws to explain missing environment
    async upload() { throw new Error("websim.upload not available in this environment. The app expects window.websim.upload(file, options) to be provided by the host."); }
  };
}
