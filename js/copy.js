(function () {
  var page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
  var storeKey = "fh-copy-v1:" + page;
  var originals = {};
  var fields = [];

  function leaves() {
    var nodes = document.querySelectorAll(
      ".ribbon .i-en, .ribbon .i-es, nav .links .i-en, nav .links .i-es, header .i-en, header .i-es, section .i-en, section .i-es, footer .i-en, footer .i-es, figcaption, .prose > h2"
    );
    return Array.prototype.filter.call(nodes, function (el) {
      return !el.querySelector(".i-en, .i-es");
    });
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(storeKey) || "{}");
    } catch (e) {
      return {};
    }
  }

  function setStatus(text) {
    var el = document.getElementById("copy-status");
    if (el) el.textContent = text;
  }

  function collect() {
    var map = {};
    fields.forEach(function (el) {
      if (el.innerHTML !== originals[el.dataset.k]) map[el.dataset.k] = el.innerHTML;
    });
    return map;
  }

  function persist() {
    var map = collect();
    if (Object.keys(map).length) localStorage.setItem(storeKey, JSON.stringify(map));
    else localStorage.removeItem(storeKey);
    setStatus("Saved in this browser");
  }

  var saved = load();
  leaves().forEach(function (el, i) {
    var k = "c" + i;
    el.dataset.k = k;
    originals[k] = el.innerHTML;
    if (Object.prototype.hasOwnProperty.call(saved, k)) el.innerHTML = saved[k];
    fields.push(el);
  });

  var bar = document.querySelector(".studio .wrap");
  if (!bar) return;
  var box = document.createElement("span");
  box.className = "copytools";
  box.innerHTML =
    '<button type="button" id="copy-edit">Edit copy</button>' +
    '<button type="button" id="copy-down">Download copy</button>' +
    '<button type="button" id="copy-reset">Reset page</button>' +
    '<span id="copy-status"></span>';
  bar.appendChild(box);

  var editing = false;
  function setEditing(on) {
    editing = on;
    fields.forEach(function (el) {
      el.contentEditable = on ? "true" : "false";
      el.spellcheck = on;
      el.classList.toggle("is-editable", on);
    });
    document.getElementById("copy-edit").textContent = on ? "Done" : "Edit copy";
    document.body.classList.toggle("copy-on", on);
    setStatus(on ? "Click any line. EN and ES are edited separately." : "");
  }

  document.getElementById("copy-edit").addEventListener("click", function () {
    if (editing) {
      persist();
      setEditing(false);
    } else {
      setEditing(true);
    }
  });

  document.addEventListener("input", function (e) {
    if (!editing) return;
    if (e.target.closest && e.target.closest("[data-k]")) persist();
  });

  document.addEventListener(
    "click",
    function (e) {
      if (!editing) return;
      var a = e.target.closest && e.target.closest("a");
      if (a && a.querySelector("[data-k]")) e.preventDefault();
    },
    true
  );

  document.getElementById("copy-down").addEventListener("click", function () {
    if (editing) persist();
    var pages = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf("fh-copy-v1:") === 0) {
        try {
          pages[key.slice("fh-copy-v1:".length)] = JSON.parse(localStorage.getItem(key));
        } catch (err) {}
      }
    }
    var blob = new Blob(
      [
        JSON.stringify(
          {
            practice: "Far Horizon Endurance",
            exportedAt: new Date().toISOString(),
            note: "Drafts from this browser. The site HTML stays the original until this file is written back.",
            pages: pages,
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "far-horizon-copy.json";
    a.click();
    setStatus("Downloaded far-horizon-copy.json");
  });

  document.getElementById("copy-reset").addEventListener("click", function () {
    if (!window.confirm("Restore the original wording on this page? Edits for this page leave this browser.")) return;
    localStorage.removeItem(storeKey);
    fields.forEach(function (el) {
      el.innerHTML = originals[el.dataset.k];
    });
    setStatus("Restored");
  });
})();
