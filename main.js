// main.js - Entry point for the extension

// Extension ID - used for metadata and storage
const ID = "com.improved.sheet-viewer";

// Initialize the extension when OBR is ready
OBR.onReady(() => {
  console.log("Sheet Viewer extension loaded");
  setupContextMenu();
  setupStorageDefaults();
  
  // Setup theme listener to match OBR's theme
  OBR.theme.getTheme().then((theme) => {
    setTheme(theme.mode.toLowerCase());
  });
  
  OBR.theme.onChange((theme) => {
    setTheme(theme.mode.toLowerCase());
  });
});

// Set up default values for settings if not already present
function setupStorageDefaults() {
  if (!localStorage.getItem(`${ID}/popoverMode`)) {
    localStorage.setItem(`${ID}/popoverMode`, "true");
  }
  
  if (!localStorage.getItem(`${ID}/popoverHeight`)) {
    localStorage.setItem(`${ID}/popoverHeight`, "600");
  }
  
  if (!localStorage.getItem(`${ID}/popoverWidth`)) {
    localStorage.setItem(`${ID}/popoverWidth`, "400");
  }
  
  if (!localStorage.getItem(`${ID}/dockPosition`)) {
    localStorage.setItem(`${ID}/dockPosition`, "floating"); // Options: floating, left, right
  }
}

// Apply the OBR theme to our UI elements
function setTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
}

// Set up the context menu items in OBR
function setupContextMenu() {
  // Add Sheet / Remove Sheet context menu
  OBR.contextMenu.create({
    id: `${ID}/context-menu-add-remove`,
    icons: [
      {
        icon: "/img/add.svg",
        label: "Add Sheet",
        filter: {
          roles: ["GM"],
          every: [
            { key: "layer", value: "CHARACTER" },
            { key: ["metadata", `${ID}/metadata`], value: undefined },
          ],
        },
      },
      {
        icon: "/img/remove.svg",
        label: "Remove Sheet",
        filter: {
          roles: ["GM"],
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],
    onClick(context) {
      const add = context.items.every(
        (item) => item.metadata[`${ID}/metadata`] === undefined
      );
      
      if (add) {
        const characterSheetURL = window.prompt(
          "Enter the character's sheet URL:"
        );
        
        if (!characterSheetURL) {
          return;
        }

        try {
          new URL(characterSheetURL);
          OBR.scene.items.updateItems(context.items, (items) => {
            for (const item of items) {
              item.metadata[`${ID}/metadata`] = {
                characterSheetURL: characterSheetURL,
              };
            }
          });
        } catch (error) {
          OBR.notification.show("Invalid URL", "ERROR");
          return;
        }
      } else {
        OBR.scene.items.updateItems(context.items, (items) => {
          for (const item of items) {
            delete item.metadata[`${ID}/metadata`];
          }
        });
      }
    },
  });

  // View Sheet context menu
  OBR.contextMenu.create({
    id: `${ID}/context-menu-view`,
    icons: [
      {
        icon: "/img/view.svg",
        label: `View sheet`,
        filter: {
          roles: ["GM", "PLAYER"],
          every: [
            { key: "layer", value: "CHARACTER" },
            {
              key: ["metadata", `${ID}/metadata`],
              value: undefined,
              operator: "!=",
            },
          ],
        },
      },
    ],
    onClick(context, elementId) {
      const metadata = context.items[0].metadata[`${ID}/metadata`];
      
      if (localStorage.getItem(`${ID}/popoverMode`) === "true") {
        displayPopover(metadata.characterSheetURL, elementId);
      } else {
        openPopupWindow(metadata.characterSheetURL);
      }
    },
  });
}

// Display the character sheet in a popover
function displayPopover(url, anchorElementId) {
  // First, remove any existing popover
  const existingPopover = document.getElementById(`${ID}-popover-container`);
  if (existingPopover) {
    existingPopover.remove();
  }
  
  const dockPosition = localStorage.getItem(`${ID}/dockPosition`) || "floating";
  
  // Use OBR's popover API to create the base popover
  OBR.popover.open({
    id: `${ID}/popover`,
    url: url,
    height: parseInt(localStorage.getItem(`${ID}/popoverHeight`) || "600"),
    width: parseInt(localStorage.getItem(`${ID}/popoverWidth`) || "400"),
    anchorElementId: anchorElementId,
    onClose: () => {
      // Clean up any custom elements we added
      const container = document.getElementById(`${ID}-popover-container`);
      if (container) {
        container.remove();
      }
    }
  }).then(() => {
    // After the popover is created, we'll enhance it with our custom UI
    enhancePopover(dockPosition);
  });
}

// Enhance the popover with custom UI for dragging, docking, and collapsing
function enhancePopover(dockPosition) {
  // We need to access the popover's iframe and add our custom UI
  // This might require some workarounds due to cross-origin restrictions
  
  // Create a wrapper to contain our enhancements
  const popoverContainer = document.createElement('div');
  popoverContainer.id = `${ID}-popover-container`;
  popoverContainer.className = 'sheet-viewer-container';
  
  // Create a header bar for our popover
  const header = document.createElement('div');
  header.className = 'sheet-viewer-header';
  
  // Add title
  const title = document.createElement('div');
  title.className = 'sheet-viewer-title';
  title.textContent = 'Character Sheet';
  
  // Add controls
  const controls = document.createElement('div');
  controls.className = 'sheet-viewer-controls';
  
  // Dock left button
  const dockLeftBtn = document.createElement('button');
  dockLeftBtn.className = 'sheet-viewer-btn dock-left';
  dockLeftBtn.innerHTML = '◀';
  dockLeftBtn.title = 'Dock to Left';
  dockLeftBtn.onclick = () => dockPopover('left');
  
  // Dock right button
  const dockRightBtn = document.createElement('button');
  dockRightBtn.className = 'sheet-viewer-btn dock-right';
  dockRightBtn.innerHTML = '▶';
  dockRightBtn.title = 'Dock to Right';
  dockRightBtn.onclick = () => dockPopover('right');
  
  // Float button
  const floatBtn = document.createElement('button');
  floatBtn.className = 'sheet-viewer-btn float';
  floatBtn.innerHTML = '⇱';
  floatBtn.title = 'Float';
  floatBtn.onclick = () => dockPopover('floating');
  
  // Collapse button
  const collapseBtn = document.createElement('button');
  collapseBtn.className = 'sheet-viewer-btn collapse';
  collapseBtn.innerHTML = '▲';
  collapseBtn.title = 'Collapse';
  collapseBtn.onclick = toggleCollapse;
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'sheet-viewer-btn close';
  closeBtn.innerHTML = '✕';
  closeBtn.title = 'Close';
  closeBtn.onclick = closePopover;
  
  // Add buttons to controls
  controls.appendChild(dockLeftBtn);
  controls.appendChild(floatBtn);
  controls.appendChild(dockRightBtn);
  controls.appendChild(collapseBtn);
  controls.appendChild(closeBtn);
  
  // Add title and controls to header
  header.appendChild(title);
  header.appendChild(controls);
  
  // Make header draggable
  header.addEventListener('mousedown', startDrag);
  
  // Add header to container
  popoverContainer.appendChild(header);
  
  // Add the popover content area
  const content = document.createElement('div');
  content.className = 'sheet-viewer-content';
  popoverContainer.appendChild(content);
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .sheet-viewer-container {
      position: absolute;
      background: var(--bs-body-bg, #fff);
      border: 1px solid var(--bs-border-color, #ccc);
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      z-index: 1000;
    }
    
    .sheet-viewer-container.docked-left {
      left: 0;
      top: 50px;
      height: calc(100vh - 100px);
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
    
    .sheet-viewer-container.docked-right {
      right: 0;
      top: 50px;
      height: calc(100vh - 100px);
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    
    .sheet-viewer-container.collapsed .sheet-viewer-content {
      display: none;
    }
    
    .sheet-viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--bs-primary, #007bff);
      color: var(--bs-light, #fff);
      cursor: move;
    }
    
    .sheet-viewer-title {
      font-weight: bold;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .sheet-viewer-controls {
      display: flex;
      gap: 4px;
    }
    
    .sheet-viewer-btn {
      background: transparent;
      border: none;
      color: var(--bs-light, #fff);
      cursor: pointer;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    
    .sheet-viewer-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .sheet-viewer-content {
      position: relative;
      height: calc(100% - 40px);
    }
  `;
  
  // Add container to the document
  document.body.appendChild(style);
  document.body.appendChild(popoverContainer);
  
  // Position the container
  if (dockPosition === 'left') {
    dockPopover('left');
  } else if (dockPosition === 'right') {
    dockPopover('right');
  } else {
    // Floating - position in the center
    const width = parseInt(localStorage.getItem(`${ID}/popoverWidth`) || "400");
    const height = parseInt(localStorage.getItem(`${ID}/popoverHeight`) || "600");
    
    popoverContainer.style.width = `${width}px`;
    popoverContainer.style.height = `${height}px`;
    popoverContainer.style.left = `calc(50% - ${width/2}px)`;
    popoverContainer.style.top = `calc(50% - ${height/2}px)`;
  }
  
  // Try to embed the popover iframe into our container
  // This is a tricky part as we need to move the iframe OBR created into our container
  try {
    const obrPopover = document.querySelector(`[data-id="${ID}/popover"]`);
    if (obrPopover) {
      const iframe = obrPopover.querySelector('iframe');
      if (iframe) {
        content.appendChild(iframe);
      }
    }
  } catch(e) {
    console.error("Failed to embed iframe:", e);
  }
}

// Dragging functionality
let dragOffsetX, dragOffsetY;

function startDrag(e) {
  const container = document.getElementById(`${ID}-popover-container`);
  if (!container || container.classList.contains('docked-left') || 
      container.classList.contains('docked-right')) {
    return;
  }
  
  dragOffsetX = e.clientX - container.getBoundingClientRect().left;
  dragOffsetY = e.clientY - container.getBoundingClientRect().top;
  
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
}

function drag(e) {
  const container = document.getElementById(`${ID}-popover-container`);
  if (!container) return;
  
  container.style.left = `${e.clientX - dragOffsetX}px`;
  container.style.top = `${e.clientY - dragOffsetY}px`;
}

function stopDrag() {
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
}

// Dock the popover to a position
function dockPopover(position) {
  const container = document.getElementById(`${ID}-popover-container`);
  if (!container) return;
  
  container.classList.remove('docked-left', 'docked-right');
  
  const width = parseInt(localStorage.getItem(`${ID}/popoverWidth`) || "400");
  const height = parseInt(localStorage.getItem(`${ID}/popoverHeight`) || "600");
  
  if (position === 'left') {
    container.classList.add('docked-left');
    container.style.width = `${width}px`;
    container.style.height = 'calc(100vh - 100px)';
    container.style.left = '0';
    container.style.top = '50px';
  } else if (position === 'right') {
    container.classList.add('docked-right');
    container.style.width = `${width}px`;
    container.style.height = 'calc(100vh - 100px)';
    container.style.right = '0';
    container.style.left = 'auto';
    container.style.top = '50px';
  } else {
    // Floating
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.left = `calc(50% - ${width/2}px)`;
    container.style.top = `calc(50% - ${height/2}px)`;
  }
  
  localStorage.setItem(`${ID}/dockPosition`, position);
}

// Toggle collapse state
function toggleCollapse() {
  const container = document.getElementById(`${ID}-popover-container`);
  if (!container) return;
  
  container.classList.toggle('collapsed');
  
  const collapseBtn = container.querySelector('.collapse');
  if (collapseBtn) {
    if (container.classList.contains('collapsed')) {
      collapseBtn.innerHTML = '▼';
      collapseBtn.title = 'Expand';
    } else {
      collapseBtn.innerHTML = '▲';
      collapseBtn.title = 'Collapse';
    }
  }
}

// Close the popover
function closePopover() {
  OBR.popover.close(`${ID}/popover`);
  
  const container = document.getElementById(`${ID}-popover-container`);
  if (container) {
    container.remove();
  }
}

// Open a popup window with the character sheet
function openPopupWindow(url) {
  const screenWidth = window.innerWidth || document.documentElement.clientWidth;
  const screenHeight = window.innerHeight || document.documentElement.clientHeight;
  
  const width = parseInt(localStorage.getItem(`${ID}/popoverWidth`) || "400");
  const height = parseInt(localStorage.getItem(`${ID}/popoverHeight`) || "800");
  
  const left = Math.max(0, (screenWidth - width) / 2);
  const top = Math.max(0, (screenHeight - height) / 2);
  
  window.open(
    url,
    "_blank",
    `left=${left},top=${top},width=${width},height=${height}`
  );
}
