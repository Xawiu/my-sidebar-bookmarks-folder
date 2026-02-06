let currentFolderId = null;

async function loadBookmarks(folderId = null) {
  const container = document.getElementById('bookmark-list');
  
  const data = await browser.storage.local.get('setting');
  const rootFolderId = data.setting ? data.setting.topId : 'toolbar_____';

  if (!folderId) {
    folderId = rootFolderId;
  }
  
  currentFolderId = folderId;

  try {
    const bookmarks = await browser.bookmarks.getChildren(folderId);
    container.innerHTML = '';

    // BACK BUTTON
    if (folderId !== rootFolderId) {
      const parentInfo = await browser.bookmarks.get(folderId);
      const parentId = parentInfo[0].parentId;

      const backBtn = document.createElement('div');
      backBtn.classList.add('bookmark', 'back-button');
      
      const backImg = document.createElement('img');
      backImg.classList.add('favicon');
      backImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';
      
      const backText = document.createElement('span');
      backText.classList.add('bookmark-text');
      backText.textContent = "... Back";

      backBtn.appendChild(backImg);
      backBtn.appendChild(backText);
      
      backBtn.onclick = () => loadBookmarks(parentId);
      container.appendChild(backBtn);
    }

    if (bookmarks.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.padding = "20px";
      emptyMsg.style.color = "#888";
      emptyMsg.textContent = "This folder is empty.";
      container.appendChild(emptyMsg);
      return;
    }

    bookmarks.forEach(bm => {
      const el = document.createElement(bm.url ? 'a' : 'div');
      el.classList.add('bookmark');
      
      if (bm.url) {
        el.classList.add('is-link');
      }
      
      const img = document.createElement('img');
      img.classList.add('favicon');
      
      if (bm.url) {
        // ===== LINK =====
        try {
          const urlObj = new URL(bm.url);
        
          if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
            img.src = `https://icons.duckduckgo.com/ip3/${urlObj.hostname}.ico`;
          } else {
            img.src = defaultIcon();
          }
        
          img.onerror = function() {
            this.onerror = null;
            this.src = defaultIcon();
          };
        
        } catch (e) {
          img.src = defaultIcon();
        }

        el.href = bm.url;
        el.target = "_self";

        el.addEventListener("click", async (e) => {
          e.preventDefault();

          if (e.shiftKey) {
            browser.windows.create({ url: bm.url });
            return;
          }

          if (e.button === 1 || e.ctrlKey || e.metaKey) {
            browser.tabs.create({ url: bm.url });
            return;
          }

          const [tab] = await browser.tabs.query({
            active: true,
            currentWindow: true
          });

          if (tab) {
            browser.tabs.update(tab.id, { url: bm.url });
          }
        });

      } else {
        // ===== FOLDER =====
        img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f8d775"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>';
        el.onclick = () => loadBookmarks(bm.id);
      }

      const span = document.createElement('span');
      span.classList.add('bookmark-text');
      span.textContent = bm.title || (bm.url ? "Untitled" : "Folder");

      el.appendChild(img);
      el.appendChild(span);
      container.appendChild(el);
    });

  } catch (error) {
    container.innerHTML = `<div style="padding:10px; color: red;">Error: Please go to settings and choose a folder.</div>`;
    console.error(error);
  }
}

function defaultIcon() {
  return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z'/></svg>";
}

// SETTINGS BUTTON
const settingsBtn = document.getElementById('open-settings');
if (settingsBtn) {
  settingsBtn.onclick = (e) => {
    e.preventDefault();
    browser.runtime.openOptionsPage();
  };
}

// RELOAD AFTER SETTINGS CHANGE
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.setting) {
    loadBookmarks();
  }
});

loadBookmarks();

