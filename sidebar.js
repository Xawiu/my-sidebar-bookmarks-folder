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
        try {
          const url = new URL(bm.url);
          img.src = `https://icons.duckduckgo.com/ip3/${new URL(bm.url).hostname}.ico`;
          
        } catch (e) {
          img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/></svg>";
        }
        img.onerror = function() { this.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/></svg>"; };
        
        el.href = bm.url;
        el.onclick = (e) => {
          e.preventDefault();
          browser.tabs.create({ url: bm.url });
        };
      } else {
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

const settingsBtn = document.getElementById('open-settings');
if (settingsBtn) {
  settingsBtn.onclick = (e) => {
    e.preventDefault();
    browser.runtime.openOptionsPage();
  };
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.setting) {
    loadBookmarks();
  }
});

loadBookmarks();
