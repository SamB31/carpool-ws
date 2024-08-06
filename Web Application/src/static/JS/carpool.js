let reconnectAttempts = 0;
const maxReconnectAttempts = 4;

function connect() {
    //var socket = new WebSocket('wss://test.quickpickup.org:443');
    var socket = new WebSocket('wss://canton.quickpickup.org:443');



    socket.onopen = () => {
        reconnectAttempts = 0;
        socket.send(JSON.stringify({ page: '1' })); 
        hideBanner();
    };


    socket.onmessage = function(event) {
        const message = JSON.parse(event.data);
        if (message['type'] === "initial") {
            updateListWithNewCheckIn(message['data']);
        }
        if (message['type'] === "endCarpool") {
            displayBanner('alert alert-success', message['data']);
        }    
        if (message['type'] === 'newCheckIn') {
            updateListWithNewCheckIn(message['data']);
        }
    };

    socket.onclose = () => {
        displayBanner('alert alert-warning', 'Lost connection to server. Attempting to reconnect...');
        attemptReconnect();
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket.close(); // Close the connection if an error occurs
    };

}

function attemptReconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts += 1;
      const reconnectDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, up to 30 seconds
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
        connect();
      }, reconnectDelay);
    } else {
      displayBanner('alert alert-danger', 'Unable to reconnect to server. Please refresh the page.');
    }
}

connect();


document.getElementById('endButton').addEventListener('click', function() {
    if (confirm('Are you sure you want to end the carpool?')) {
        // User confirmed, send WebSocket message
        endcarpool();
    }
});

function updateListWithNewCheckIn(data) {
    // Find the table body in your HTML
    const tableBody = document.querySelector('.table tbody');

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add new rows for each check-in record
    data.forEach(record => {
        const row = document.createElement('tr');

        // Adding a click event listener to the row
        row.addEventListener('click', function() {
            // Toggle the 'table-warning' class to highlight the row
            this.classList.toggle('table-warning');
            // Toggle the 'selected' attribute to track the row
            this.setAttribute('data-selected', this.getAttribute('data-selected') === 'true' ? 'false' : 'true');
        });


        // Adding a data attribute to store familyId
        row.setAttribute('data-child-id', record.uniqueId);
        
        // Creating and appending cells for other data
        const firstNameCell = document.createElement('td');
        firstNameCell.textContent = record.firstName;
        row.appendChild(firstNameCell);

        const lastNameCell = document.createElement('td');
        lastNameCell.textContent = record.lastName;
        row.appendChild(lastNameCell);

        const stationCell = document.createElement('td');
        stationCell.textContent = record.station;
        row.appendChild(stationCell);

        const arrivedAtCell = document.createElement('td');
        arrivedAtCell.textContent = new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/^0(?:0:)?/, '');
        row.appendChild(arrivedAtCell);

        // Append the row to the table body
        tableBody.appendChild(row);
    });
}

document.getElementById('checkoutButton').addEventListener('click', function() {
    const selectedRows = document.querySelectorAll('tr[data-selected="true"]');
    // Create an array to hold all checked out family IDs
    const checkedOutFamilyIds = Array.from(selectedRows).map(row => row.getAttribute('data-child-id'));

    if (checkedOutFamilyIds.length > 0) {
        // Send this array to the server
        checkoutFamily(checkedOutFamilyIds);
    } else {
        alert('Please select a family to check out.');
    }
});

document.getElementById('deleteButton').addEventListener('click', function() {
    const selectedRows = document.querySelectorAll('tr[data-selected="true"]');
    // Create an array to hold all checked out family IDs
    const deleteFamilyIds = Array.from(selectedRows).map(row => row.getAttribute('data-child-id'));

    if (deleteFamilyIds.length > 0) {
        // Send this array to the server
        deleteFamily(deleteFamilyIds);
    } else {
        alert('Please select a family to check out.');
    }
});

function endcarpool() {
    fetch('/historical/submit-end', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify({ 'action': 'endcarpool' }),
    })
    
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Display success banner
        } else {
            displayBanner('alert alert-danger', data.message)
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function checkoutFamily(familyId) {
    
    fetch('/carpool/submit-check-out', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify({ 'childIds': familyId }),
    })
    
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Display success banner
            displayBanner('alert alert-success', data.message);
        } else {
            displayBanner('alert alert-danger', data.message)
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function deleteFamily(familyId) {
    
    fetch('/carpool/submit-delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify({ 'childIds': familyId }),
    })
    
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Display success banner
            displayBanner('alert alert-success', data.message);
        } else {
            displayBanner('alert alert-danger', data.message)
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

document.getElementById('checkInForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const form = this;
    const inputField = form.querySelector('input[name="familyId"]');
    const input = inputField.value.trim();

    if (input) {
        if (isNaN(input)) {
            // If input is not a number, treat it as a last name
            searchByLastName(input);
        } else {
            // If input is a number, treat it as a family ID
            checkInFamily(input);
        }
    } else {
        displayBanner('alert alert-danger', 'Please enter a family ID or last name');
    }
});
function displayBanner(type, message) {
    const banner = document.getElementById('banner');
    const bannerMessage = document.getElementById('bannerMessage');
    const bannerClose = document.getElementById('bannerClose');

    banner.className = type; // 'success' or 'error'
    bannerMessage.innerText = message;
    banner.style.display = 'flex';

    // Add click event listener for the dismiss button
    bannerClose.onclick = function() {
        banner.style.display = 'none';
    };

}

// Hide banner function
function hideBanner() {
    const banner = document.getElementById('banner');
    banner.style.display = 'none';
}

function searchByLastName(lastName) {
    fetch('/carpool/search-by-lastname', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lastName: lastName }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.families.length === 1) {
                // If only one family found, check them in directly
                checkInFamily(data.families[0].familyId);
            } else if (data.families.length > 1) {
                // If multiple families found, display options
                displayFamilyOptions(data.families);
            } else {
                displayBanner('alert alert-warning', 'No families found with that last name');
            }
        } else {
            displayBanner('alert alert-danger', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        displayBanner('alert alert-danger', 'Error during last name search');
    });
}

function displayFamilyOptions(families) {
    const optionsContainer = document.getElementById('familyOptions');
    optionsContainer.innerHTML = '';
    
    families.forEach(family => {
        const button = document.createElement('button');
        button.textContent = `${family.lastName}, ${family.firstName} (ID: ${family.familyId})`;
        button.classList.add('btn', 'btn-secondary', 'm-1');
        button.onclick = () => checkInFamily(family.familyId);
        optionsContainer.appendChild(button);
    });

    optionsContainer.style.display = 'block';
}

function checkInFamily(familyId) {
    fetch('/carpool/submit-check-in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ familyId: familyId }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayBanner('alert alert-success', data.message);
            document.querySelector('input[name="familyId"]').value = '';
        } else {
            displayBanner('alert alert-danger', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        displayBanner('alert alert-danger', 'Error during check-in');
    });
}
