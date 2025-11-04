<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Ephemeral File Link (2 day auto-delete)</title>
  <!-- Added Google Font: Stack Sans Text -->
  <link href="https://fonts.googleapis.com/css2?family=Stack+Sans+Text:wght@300;400;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main class="container">
    <h1>Ephemeral File Link</h1>
    <p class="muted">Select a file, upload it and get a direct-download URL. Files will be marked to expire in 2 days.</p>

    <form id="uploadForm" class="card">
      <label class="fileRow">
        <input id="fileInput" type="file" />
        <span id="fileName">No file chosen</span>
      </label>

      <div class="row">
        <label>
          Link lifetime:
          <select id="lifetime">
            <option value="2">2 days (default)</option>
            <option value="1">1 day</option>
            <option value="7">7 days</option>
          </select>
        </label>
      </div>

      <div class="row actions">
        <button id="uploadBtn" type="button">Upload & Get Link</button>
        <button id="clearBtn" type="button" class="ghost">Clear</button>
      </div>

      <div id="status" class="status" aria-live="polite"></div>
      <div id="result" class="result" hidden>
        <label>Direct download link (copy/share):</label>
        <div class="resultRow">
          <input id="directUrl" readonly />
          <button id="copyBtn">Copy</button>
          <a id="openBtn" target="_blank" rel="noopener" class="ghost">Open</a>
        </div>
        <p class="muted small">Link will be automatically removed after its expiry. See below for management.</p>
      </div>
    </form>

    <section class="card" id="manage">
      <h2>Uploads (local index)</h2>
      <p class="muted small">This list is stored in your browser and used to show expiry and attempt cleanup. If you want to force-delete a file try the Cleanup button for each item — it will try to call the provider delete API if available.</p>
      <ul id="uploadsList" class="uploads"></ul>
      <div class="row">
        <button id="cleanupAll" class="ghost">Attempt Cleanup Now</button>
        <button id="purgeLocal" class="danger">Purge Local Records</button>
      </div>
    </section>

    <footer class="muted small">Note: This app depends on the hosting environment's upload API. Uploaded files are given an expiry timestamp in metadata and stored locally so we can attempt deletion after expiry. Actual deletion depends on the storage provider.</footer>
  </main>

  <script type="module" src="app.js"></script>
</body>
</html>
