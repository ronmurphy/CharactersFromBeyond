// settings.js - Settings page for the Sheet Viewer extension

const ID = "com.improved.sheet-viewer";

// Initialize settings when the page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeSettings();
  setupEventListeners();
  
  // Check if we're in an Owlbear Rodeo context
  if (typeof OBR !== 'undefined') {
    // Set up theme listener
    OBR.theme.getTheme().then((theme) => {
      setTheme(theme.mode.toLowerCase());
    });
    
    OBR.theme.onChange((theme) => {
      setTheme(theme.mode.toLowerCase());
    });
    
    // Check if the scene is ready
    OBR.scene.isReady().then(isReady => {
      if (!isReady) {
        showSceneNotReadyMessage();
      }
    });
  } else {
    // Not in OBR context, show alternative content
    showReadmeContent();
  }
});

// Apply the OBR theme to our UI elements
function setTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
}

// Initialize settings from local storage
function initializeSettings() {
  // Set default values if not present
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
    localStorage.setItem(`${ID}/dockPosition`, "floating");
  }
  
  // Update form with stored settings
  const popoverMode = localStorage.getItem(`${ID}/popoverMode`) === "true";
  const popoverHeight = parseInt(localStorage.getItem(`${ID}/popoverHeight`));
  const popoverWidth = parseInt(localStorage.getItem(`${ID}/popoverWidth`));
  const dockPosition = localStorage.getItem(`${ID}/dockPosition`);
  
  // Set radio buttons
  document.getElementById('popoverMode').checked = popoverMode;
  document.getElementById('popupMode').checked = !popoverMode;
  
  // Set docking options
  document.querySelector(`input[name="dockPosition"][value="${dockPosition}"]`).checked = true;
  
  // Set dimensions
  document.getElementById('popoverHeight').value = popoverHeight;
  document.getElementById('popoverWidth').value = popoverWidth;
  
  // Show/hide relevant options based on popover mode
  togglePopoverOptions(popoverMode);
}

// Set up event listeners for the settings form
function setupEventListeners() {
  // Display mode change
  document.getElementById('popoverMode').addEventListener('change', function() {
    const popoverMode = this.checked;
    localStorage.setItem(`${ID}/popoverMode`, popoverMode.toString());
    togglePopoverOptions(popoverMode);
  });
  
  document.getElementById('popupMode').addEventListener('change', function() {
    const popoverMode = !this.checked;
    localStorage.setItem(`${ID}/popoverMode`, popoverMode.toString());
    togglePopoverOptions(popoverMode);
  });
  
  // Popover size changes
  document.getElementById('popoverHeight').addEventListener('change', function() {
    localStorage.setItem(`${ID}/popoverHeight`, this.value);
  });
  
  document.getElementById('popoverWidth').addEventListener('change', function() {
    localStorage.setItem(`${ID}/popoverWidth`, this.value);
  });
  
  // Dock position changes
  document.querySelectorAll('input[name="dockPosition"]').forEach(radio => {
    radio.addEventListener('change', function() {
      localStorage.setItem(`${ID}/dockPosition`, this.value);
    });
  });
}

// Show/hide popover-specific options based on the popover mode
function togglePopoverOptions(showOptions) {
  const popoverOptions = document.getElementById('popoverOptions');
  if (popoverOptions) {
    popoverOptions.style.display = showOptions ? 'block' : 'none';
  }
}

// Show a message when no scene is ready
function showSceneNotReadyMessage() {
  const container = document.getElementById('settingsContainer');
  container.innerHTML = `
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">No Active Scene</h5>
        <p class="card-text">
          In order to use the Improved Sheet Viewer tool you must have an active
          Scene in Owlbear Rodeo.
        </p>
      </div>
    </div>
  `;
}

// Show README content when not in OBR context
function showReadmeContent() {
  const container = document.getElementById('settingsContainer');
  container.innerHTML = `
    <div class="readme-container">
      <h1>Improved Sheet Viewer for Owlbear Rodeo</h1>
      <p>This extension allows you to associate character sheets with tokens in Owlbear Rodeo.</p>
      
      <h2>Features</h2>
      <ul>
        <li>Associate any URL with character tokens</li>
        <li>View sheets in a popup window or embedded popover</li>
        <li>Dock the sheet viewer to the left or right side</li>
        <li>Drag the sheet viewer to reposition it</li>
        <li>Collapse the sheet viewer to just a header bar</li>
      </ul>
      
      <h2>Supported Character Sheet Sources</h2>
      <ul>
        <li>D&D Beyond</li>
        <li>PDF files</li>
        <li>Shard</li>
        <li>Roll20</li>
        <li>Demiplane</li>
        <li>Box.com PDF</li>
        <li>Google Drive PDF</li>
        <li>Dropbox PDF</li>
        <li>Any other URL that can be displayed in an iframe</li>
      </ul>
      
      <h2>Usage</h2>
      <ol>
        <li>Right-click on a character token</li>
        <li>Select "Add Sheet" from the context menu</li>
        <li>Enter the URL for the character sheet</li>
        <li>To view the sheet, right-click on the token and select "View Sheet"</li>
      </ol>
      
      <h2>Installation</h2>
      <p>To install this extension in Owlbear Rodeo:</p>
      <ol>
        <li>Go to the Add-ons menu in Owlbear Rodeo</li>
        <li>Click "Add Extension"</li>
        <li>Enter the URL for this extension</li>
      </ol>
    </div>
  `;
}
