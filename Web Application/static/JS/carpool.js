const socket = new WebSocket('ws://192.168.1.136:8080');

socket.onopen = () => {
    socket.send(JSON.stringify({ page: '1' })); 
};


socket.onmessage = function(event) {
    const message = JSON.parse(event.data);
    if (message.type === "initial") {
        updateListWithNewCheckIn(message.data);
    }
    if (message.type === "endCarpool") {
        displayBanner('alert alert-success', message.data);
    }    
    if (message.type === 'newCheckIn') {

        updateListWithNewCheckIn(message.data);
    }
};

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

        // Creating and appending a selector box with familyId as value
        const selectorCell = document.createElement('td');
        const selector = document.createElement('input');
        selector.setAttribute('type', 'checkbox');
        selector.setAttribute('name', 'checkedOutFamily');
        selector.setAttribute('value', record.familyId);
        selectorCell.appendChild(selector);
        row.appendChild(selectorCell);

        // Creating and appending cells for other data
        const firstNameCell = document.createElement('td');
        firstNameCell.textContent = record.firstName;
        row.appendChild(firstNameCell);

        const lastNameCell = document.createElement('td');
        lastNameCell.textContent = record.lastName;
        row.appendChild(lastNameCell);

        const arrivedAtCell = document.createElement('td');
        arrivedAtCell.textContent = new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/^0(?:0:)?/, '');;

        row.appendChild(arrivedAtCell);

        // Append the row to the table body
        tableBody.appendChild(row);
    });
}

document.getElementById('checkoutButton').addEventListener('click', function() {
    const checkedInputs = document.querySelectorAll('input[name="checkedOutFamily"]:checked');
    // Create an array to hold all checked out family IDs
    const checkedOutFamilyIds = Array.from(checkedInputs).map(input => input.value);

    console.log(checkedOutFamilyIds); // This will log an array of all checked values

    if (checkedOutFamilyIds.length > 0) {
        // Send this array to the server
        checkoutFamily(checkedOutFamilyIds);
    } else {
        alert('Please select a family to check out.');
    }
});


function endcarpool() {
    fetch('/submit-end', {
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
    
    fetch('/submit-check-out', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify({ 'familyId': familyId }),
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


    fetch('/submit-check-in', {
        method: 'POST',
        body: new FormData(this),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Display success banner
            displayBanner('alert alert-success', data.message);
            inputField.value = ''
        } else {
            displayBanner('alert alert-danger', data.message)
            inputField.value = ''
        }
    })
    .catch(error => {
        console.error('Error:', error);
        displayBanner('error', 'Error during check-in');
    });
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