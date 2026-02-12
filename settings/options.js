let _bookmarkFolders = [];

async function restore() {
    try {
        const d = await browser.storage.local.get('setting');
        const settings = d.setting || {};
        
        const sidebarId = settings.sideId || 'toolbar_____';
        const popupId = settings.popupId || 'toolbar_____';
        const contextId = settings.contextId || 'unfiled_____';
        
        const isPadded = settings.isPadded || false;
        document.getElementById('isPadded').checked = isPadded;

        await setFolderList('sideId', sidebarId);
        await setFolderList('popupId', popupId);
        await setFolderList('contextId', contextId);
    } catch (e) {
        console.error("Error during restore:", e);
    }
}

async function save() {
    const setting = {
        sideId: document.getElementById('sideId').value,
        popupId: document.getElementById('popupId').value,
        contextId: document.getElementById('contextId').value,
        isPadded: document.getElementById('isPadded').checked
    };
    await browser.storage.local.set({ setting });
    console.log("Settings saved:", setting);
}

async function setFolderList(selectElementId, currentId) {
    const root = await browser.bookmarks.getTree();
    const select = document.getElementById(selectElementId);
    
    _bookmarkFolders = [];
    addBookmarkItem(root[0].children, 0);
    
    select.innerHTML = ''; 
    _bookmarkFolders.forEach(bmf => {
        const opt = document.createElement('option');
        opt.value = bmf.id;
        opt.textContent = bmf.title;
        if (bmf.id === currentId) opt.selected = true;
        select.appendChild(opt);
    });
}

function addBookmarkItem(bookmarks, index) {
    for (const bm of bookmarks) {
        if (!bm.url) {
            _bookmarkFolders.push({
                id: bm.id,
                title: "\u00A0\u00A0".repeat(index) + (bm.title || "Untitled")
            });
            if (bm.children) addBookmarkItem(bm.children, index + 1);
        }
    }
}

function localizeHtmlPage() {
    const objects = document.querySelectorAll('[data-i18n]');
    for (const obj of objects) {
        const key = obj.getAttribute('data-i18n');
        obj.textContent = browser.i18n.getMessage(key);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    localizeHtmlPage(); //i18n
    restore();
    document.getElementById('sideId').addEventListener('change', save);
    document.getElementById('popupId').addEventListener('change', save);
    document.getElementById('contextId').addEventListener('change', save);
    document.getElementById('isPadded').addEventListener('change', save);
});
