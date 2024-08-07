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

function updateListWithNewCheckIn(data) {
    // Find the table body in your HTML
    const tableBody = document.querySelector('.table tbody');

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add new rows for each check-in record
    data.forEach(record => {
        const row = document.createElement('tr');
        console.log(record.grade)
        const gradeClass = `g${record.grade}-color`; // Assuming record.grade is something like "k3", "1", etc.
        row.classList.add(gradeClass); 

        // Adding a data attribute to store familyId
        row.setAttribute('data-child-id', record.uniqueId);

        // Creating and appending cells for other data
        const gradeNameCell = document.createElement('td');
        gradeNameCell.textContent = record.grade;
        row.appendChild(gradeNameCell);
        
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