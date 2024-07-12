const socket = new WebSocket('ws://192.168.1.136:8080');

socket.onopen = () => {

    socket.send(JSON.stringify({ page: '2' })); 
};

socket.onmessage = function(event) {
    const message = JSON.parse(event.data);
    if (message.type === "historical") {
        updateListWithNewCheckIn(message.data);
    }
};

function updateListWithNewCheckIn(data) {
    // Find the table body in your HTML
    const tableBody = document.querySelector('.table tbody');

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add new rows for each check-in record
    data.forEach(record => {
        const row = document.createElement('tr');

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