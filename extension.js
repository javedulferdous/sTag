let list = document.getElementById('extension-list');
let btncount = 0;
let isListPopulated = false;

registerEvents();
// Send the attribute to the webpage, so that it can get focus
function focusOnWebPage(e) {    
    console.log('hit focus: ',e.target)
    // Send the content to the webpage
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        // Connect to the active tab
        let port = chrome.tabs.connect(tabs[0].id);
        port.postMessage({
            // e.target gives the element. Then getting the attribute value for name
            customAttrValue: e.target.getAttribute('data-semanticname')
        });
    });
}

// Build an anchor tag and wrap it with li
function buildElement(attributes) {
    let li = document.createElement("div");

    let a = document.createElement("a");
    a.dataset.semanticname = attributes.semanticname;
    a.text = 'Go to '+'"'+attributes.text+'"';
    // Set onclick for each list element
    a.onclick = focusOnWebPage;

    let button = document.createElement("BUTTON");
    button.innerHTML = 'Delete';
    button.id = 'btn' + btncount;
    btncount++;

    li.append(a);
    //li.append(button);

    return li;
}

// This sends deleted element information to webpage
// So that attribtue JSON can be updated
function updateSenderOnDeletion(dataAttrVal) {
    // Send content to the webpage
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        // Connect to the active tab
        let port = chrome.tabs.connect(tabs[0].id);
        port.postMessage({
            // e.target gives the element. Then getting the attribute value for name
            deletedAttrVal: dataAttrVal
        });
    });
}

function deleteOperation(e) {
    e = e || window.event;

    // target brings up the element that's being clicked on the document
    var target = e.target || e.srcElement,
        text = target.textContent || target.innerText;
    
    // Pass deleted element information to the sender
    // Delete button is placed after <a> tag that has data-attr. Thats why accessing previous sibling here                
    updateSenderOnDeletion(target.previousSibling.getAttribute('data-semanticname'));

    list.removeChild(target.parentNode);
}

// Access via keyboard. 
function keyboardAcessToListItem(e) {
    console.log('hit here');
    $("#extension-list li:first-child").addClass('selected');
    
    e = e || window.event;
    document.addEventListener("keydown",function (e) {
        console.log(e.keyCode);
        if (e.keyCode == 38) { // up
            let selected = $(".selected");
            $("#extension-list li").removeClass("selected");
            if (selected.prev().length == 0) {
                selected.siblings().last().addClass("selected");
            } else {
                selected.prev().addClass("selected");
            }
        }
        if (e.keyCode == 40) { // down
            let selected = $(".selected");
            $("#extension-list li").removeClass("selected");
            if (selected.next().length == 0) {
                selected.siblings().first().addClass("selected");
            } else {
                selected.next().addClass("selected");
            }
        }        
        // Enter simulates click to focus the element on the webpage2
        if (e.keyCode == 13){ // enter
            simulateClickEventOnExtensionList();
        }

        // Keyboard shortcut to remove a list item
        if(e.keyCode == 82){ // if 'R' is pressed
            let selected = $(".selected");
            console.log('From Keyboard: ', $(".selected > a").attr('data-semanticname'));
            updateSenderOnDeletion($(".selected > a").attr('data-semanticname'));
            setTimeout($(".selected").remove(),200);                 
        }
    });
}

function simulateClickEventOnExtensionList(){
    let selected = $(".selected a");
    selected.trigger('click');
}

function registerEvents() {
    // It detects the clicked element and delete the list element if Delete button is clicked.
    document.addEventListener('click', deleteOperation, false);

    // User has to click on the extension first
    document.addEventListener('click', keyboardAcessToListItem);
    
    //TODO: Currently not working. 'Selected' should change on mouse hover in list items on extension. Need to set it after list load. Investigation needed    
    $("#extension-list li").mouseover(function() {
        $("#extension-list li").removeClass("selected");
        $(this).addClass("selected");
    }).click(function() {
        simulateClickEventOnExtensionList();
    });
}

// First-thing here
// Wait till loading the page to initiate connection  
window.addEventListener('load', (event) => {    
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        // Connect to the active tab
        let port = chrome.tabs.connect(tabs[0].id);

        // Listens for the message from the content.js
        port.onMessage.addListener((response) => {
            // Build the element using the existing attributes      
            //console.log(response.attributes);
            let element = buildElement(response.attributes);
            // Add to the list in Extension                  
            list.append(element);
        });        
    });
});