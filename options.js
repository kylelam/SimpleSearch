// Saves options to chrome.storage
function save_options() {
  var color = document.getElementById('color').value;
  
  var defaultAction = document.getElementById('defaultAction').value;
  
  var likesColor = document.getElementById('like').checked;
  
  
  chrome.storage.sync.set({
    favoriteColor: color,
    likesColor: likesColor,
	defaultAction: defaultAction
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    favoriteColor: 'red',
    likesColor: true,
	defaultAction: 0
  }, function(items) {
    document.getElementById('color').value = items.favoriteColor;
    document.getElementById('like').checked = items.likesColor;
	document.getElementById('defaultAction').value = items.defaultAction;
	
  });
}

document.addEventListener('DOMContentLoaded', restore_options);

if ( document.getElementById('save') != null ) {
document.getElementById('save').addEventListener('click', save_options);
}