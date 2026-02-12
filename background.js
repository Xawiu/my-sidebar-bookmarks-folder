async function updateContextMenu() {
    try {
        await browser.contextMenus.removeAll();

        const d = await browser.storage.local.get('setting');
        const contextFolderId = (d.setting && d.setting.contextId) ? d.setting.contextId : 'unfiled_____';

        browser.contextMenus.create({
            id: "root",
            title: browser.i18n.getMessage("shortName"),
            contexts: ["all"]
        });

        const folderTree = await browser.bookmarks.getSubTree(contextFolderId);
        
        buildMenuRecursive(folderTree[0].children, "root");

    } catch (e) {
        console.error("Context menu error:", e);
    }
}


// Sub-folders
function buildMenuRecursive(bookmarks, parentMenuId) {
    if (!bookmarks) return;

    bookmarks.forEach((bm, index) => {
        // generate ID for each element and separator
        const myId = bm.id ? "bm-" + bm.id : "sep-" + parentMenuId + "-" + index;

        if (bm.type === 'separator') {
            browser.contextMenus.create({
                id: myId, // Important: unique ID
                type: "separator",
                parentId: parentMenuId,
                contexts: ["all"]
            });
        } else if (!bm.url) {
            // Folder
            browser.contextMenus.create({
                id: myId,
                parentId: parentMenuId,
                title: `🗁  ${bm.title}`,
                contexts: ["all"]
            });
            if (bm.children && bm.children.length > 0) {
                buildMenuRecursive(bm.children, myId);
            }
        } else {
            // Url
            browser.contextMenus.create({
                id: myId,
                parentId: parentMenuId,
                title: bm.title || browser.i18n.getMessage("untitled"),
                contexts: ["all"]
            });
        }
    });
}

// Click
browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId.startsWith("bm-")) {
        const id = info.menuItemId.replace("bm-", "");
        const [bm] = await browser.bookmarks.get(id);
        
        if (bm && bm.url) {
            if (bm.url.startsWith('javascript:')) {
                // Bookmarklets
                const code = decodeURIComponent(bm.url.replace('javascript:', ''));
                browser.scripting.executeScript({
                    target: { tabId: tab.id },
                    world: "MAIN",
                    func: (codeToRun) => {
                        const s = document.createElement('script');
                        s.textContent = codeToRun;
                        document.documentElement.appendChild(s);
                        s.remove();
                    },
                    args: [code]
                });
            } else {
                // normal links
                browser.tabs.update(tab.id, { url: bm.url });
            }
        }
    }
});

browser.runtime.onInstalled.addListener(updateContextMenu);
browser.storage.onChanged.addListener((changes) => {
    if (changes.setting) updateContextMenu();
});
browser.bookmarks.onChanged.addListener(updateContextMenu);
browser.bookmarks.onCreated.addListener(updateContextMenu);
browser.bookmarks.onRemoved.addListener(updateContextMenu);
