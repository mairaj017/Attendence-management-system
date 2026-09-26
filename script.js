function initializeData() {
    if (!localStorage.getItem('students')) {
        const sampleStudents = [
            { id: 1, name: 'Aman Kumar', roll: '001', class: 'Class A' },
            { id: 2, name: 'Priya Singh', roll: '002', class: 'Class A' },
            { id: 3, name: 'Raj Patel', roll: '003', class: 'Class B' },
            { id: 4, name: 'Neha Sharma', roll: '004', class: 'Class B' },
            { id: 5, name: 'Akash Verma', roll: '005', class: 'Class C' }
        ];
        localStorage.setItem('students', JSON.stringify(sampleStudents));
    }

    if (!localStorage.getItem('attendance')) {
        localStorage.setItem('attendance', JSON.stringify([]));
    }
}

function getStudents() {
    return JSON.parse(localStorage.getItem('students')) || [];
}

function getAttendanceRecords() {
    return JSON.parse(localStorage.getItem('attendance')) || [];
}

function saveStudents(students) {
    localStorage.setItem('students', JSON.stringify(students));
}

function saveAttendanceRecords(records) {
    localStorage.setItem('attendance', JSON.stringify(records));
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }

    if (sectionId === 'dashboard') {
        updateDashboard();
    } else if (sectionId === 'students') {
        loadStudents();
    }
}

function updateDashboard() {
    const students = getStudents();
    const records = getAttendanceRecords();
    const today = new Date().toISOString().split('T')[0];

    const todayRecords = records.filter(record => record.date === today);
    const presentCount = todayRecords.filter(record => record.status === 'present').length;
    const absentCount = todayRecords.filter(record => record.status === 'absent').length;
    const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('presentToday').textContent = presentCount;
    document.getElementById('absentToday').textContent = absentCount;
    document.getElementById('attendanceRate').textContent = attendanceRate + '%';

    drawAttendanceChart();
}

function drawAttendanceChart() {
    const records = getAttendanceRecords();
    const labels = [];
    const presentCounts = [];
    const absentCounts = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const formattedDate = date.toISOString().split('T')[0];
        labels.push(formattedDate);

        const dateRecords = records.filter(record => record.date === formattedDate);
        presentCounts.push(dateRecords.filter(record => record.status === 'present').length);
        absentCounts.push(dateRecords.filter(record => record.status === 'absent').length);
    }

    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;

    if (ctx.chart) {
        ctx.chart.destroy();
    }

    ctx.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Present',
                    data: presentCounts,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Absent',
                    data: absentCounts,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    precision: 0
                }
            }
        }
    });
}

function loadStudentsForAttendance() {
    const students = getStudents();
    const selectedClass = document.getElementById('attendanceClass').value;
    const selectedDate = document.getElementById('attendanceDate').value;

    if (!selectedDate) {
        alert('Please select a date');
        return;
    }

    const records = getAttendanceRecords();
    const list = document.getElementById('attendanceList');
    list.innerHTML = '';

    const filteredStudents = students.filter(student => student.class === selectedClass);
    if (!filteredStudents.length) {
        list.innerHTML = '<p style="padding: 1rem; text-align: center; color: #94a3b8;">No students found for this class.</p>';
        document.getElementById('saveAttendanceBtn').style.display = 'none';
        return;
    }

    filteredStudents.forEach(student => {
        const existingRecord = records.find(record => record.date === selectedDate && record.studentId === student.id);
        const status = existingRecord ? existingRecord.status : '';

        const row = document.createElement('div');
        row.className = 'attendance-item';
        row.dataset.studentId = student.id;
        row.dataset.status = status;

        row.innerHTML = `
            <div class="student-info">
                <h4>${student.name}</h4>
                <p>Roll No: ${student.roll}</p>
            </div>
            <div class="attendance-controls">
                <button type="button" class="attendance-toggle ${status === 'present' ? 'present' : ''}" data-status="present" onclick="toggleAttendance(${student.id}, 'present')">✓ Present</button>
                <button type="button" class="attendance-toggle ${status === 'absent' ? 'absent' : ''}" data-status="absent" onclick="toggleAttendance(${student.id}, 'absent')">✗ Absent</button>
            </div>
        `;

        list.appendChild(row);
    });

    document.getElementById('saveAttendanceBtn').style.display = 'block';
}

function toggleAttendance(studentId, status) {
    const item = document.querySelector(`.attendance-item[data-student-id="${studentId}"]`);
    if (!item) return;

    const buttons = item.querySelectorAll('.attendance-toggle');
    buttons.forEach(button => {
        button.classList.remove('present', 'absent');
        button.dataset.selected = 'false';
    });

    const selectedButton = item.querySelector(`.attendance-toggle[data-status="${status}"]`);
    if (selectedButton) {
        selectedButton.classList.add(status === 'present' ? 'present' : 'absent');
        selectedButton.dataset.selected = 'true';
    }

    item.dataset.status = status;
}

function saveAttendance() {
    const selectedDate = document.getElementById('attendanceDate').value;
    if (!selectedDate) {
        alert('Please select a date');
        return;
    }

    const records = getAttendanceRecords();
    const items = document.querySelectorAll('.attendance-item');

    items.forEach(item => {
        const studentId = Number(item.dataset.studentId);
        const status = item.dataset.status;

        if (!status) return;

        const existingIndex = records.findIndex(record => record.date === selectedDate && record.studentId === studentId);
        if (existingIndex !== -1) {
            records.splice(existingIndex, 1);
        }

        records.push({ date: selectedDate, studentId, status });
    });

    saveAttendanceRecords(records);
    alert('Attendance saved successfully!');
    updateDashboard();
    document.getElementById('saveAttendanceBtn').style.display = 'none';
    document.getElementById('attendanceList').innerHTML = '';
}

function generateReport() {
    const students = getStudents();
    const records = getAttendanceRecords();
    const month = document.getElementById('reportMonth').value || new Date().toISOString().slice(0, 7);
    const selectedClass = document.getElementById('reportClass').value;
    const reportBody = document.getElementById('reportBody');

    reportBody.innerHTML = '';

    let filteredStudents = students;
    if (selectedClass !== 'All Classes') {
        filteredStudents = students.filter(student => student.class === selectedClass);
    }

    filteredStudents.forEach(student => {
        const studentRecords = records.filter(record => record.studentId === student.id && record.date.startsWith(month));
        const presentCount = studentRecords.filter(record => record.status === 'present').length;
        const absentCount = studentRecords.filter(record => record.status === 'absent').length;
        const totalDays = studentRecords.length;
        const attendancePercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.roll}</td>
            <td>${student.name}</td>
            <td>${student.class}</td>
            <td>${presentCount}</td>
            <td>${absentCount}</td>
            <td>
                <span style="color: ${attendancePercentage >= 75 ? '#10b981' : '#ef4444'}; font-weight: bold;">
                    ${attendancePercentage}%
                </span>
            </td>
        `;

        reportBody.appendChild(row);
    });

    if (!reportBody.children.length) {
        reportBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 1rem; color: #94a3b8;">No data available</td></tr>';
    }
}

function loadStudents() {
    const students = getStudents();
    const tableBody = document.getElementById('studentsBody');
    tableBody.innerHTML = '';

    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.roll}</td>
            <td>${student.name}</td>
            <td>${student.class}</td>
            <td><button class="btn-danger" onclick="deleteStudent(${student.id})">Delete</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function showAddStudent() {
    document.getElementById('addStudentForm').style.display = 'block';
}

function hideAddStudent() {
    document.getElementById('addStudentForm').style.display = 'none';
    document.getElementById('studentName').value = '';
    document.getElementById('studentRoll').value = '';
}

function addStudent() {
    const name = document.getElementById('studentName').value.trim();
    const roll = document.getElementById('studentRoll').value.trim();
    const studentClass = document.getElementById('studentClass').value;

    if (!name || !roll) {
        alert('Please fill all fields');
        return;
    }

    const students = getStudents();
    const nextId = students.length ? Math.max(...students.map(student => student.id)) + 1 : 1;

    students.push({ id: nextId, name, roll, class: studentClass });
    saveStudents(students);
    loadStudents();
    hideAddStudent();
    alert('Student added successfully!');
}

function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) {
        return;
    }

    let students = getStudents();
    students = students.filter(student => student.id !== id);
    saveStudents(students);

    const records = getAttendanceRecords();
    const filteredRecords = records.filter(record => record.studentId !== id);
    saveAttendanceRecords(filteredRecords);

    loadStudents();
    updateDashboard();
    alert('Student deleted successfully!');
}

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    document.getElementById('attendanceDate').value = today;
    document.getElementById('reportMonth').value = month;

    initializeData();
    updateDashboard();
    loadStudents();
    generateReport();
});
